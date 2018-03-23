// @flow

import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import Koa from 'koa';
import koaBodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import koaLogger from 'koa-logger';
import detect from 'detect-port-alt';
import validateAppName from 'validate-npm-package-name';
import semver from 'semver';
import exitHook from 'async-exit-hook';
import createError from 'http-errors';
import { initConfig, isClass } from './util';
import {
  AppInitError,
  CollectorAuthError,
  ControllerRegisterError,
  ImporterInitError,
  ImporterRegisterError,
  ProxyRegisterError,
  SchemaRegisterError,
} from './errors';
import { ApiRpc } from './ApiRpc';

const debug = require('debug')('neuron:App');

/**
 * Neuron App.
 */
export class App {
  rootDir: string;
  config: Object;
  package: Object;
  ip: string;
  port: number;
  id: string;
  version: string;
  api: ApiRpc;
  app: Koa;
  router: Router;
  schemas: Object;
  importers: Object;
  controllers: Object;
  proxies: Object;

  /**
   * @param {Object} params App init params.
   * @param {string} params.rootDir If specified, overrides app root dir.
   * @param {Object} params.customConfig If specified, adds app specific custom config.
   */
  constructor(params: { rootDir?: string, customConfig?: Object } = {}) {
    this.rootDir = path.dirname(process.mainModule.filename);
    if (params.rootDir) {
      this.rootDir = params.rootDir;
    }

    this.config = initConfig(this.rootDir, params.customConfig);

    // eslint-disable-next-line
    this.package = require(path.resolve(this.rootDir, 'package.json'));

    const { validForNewPackages } = validateAppName(this.package.name);
    if (!validForNewPackages) {
      throw new AppInitError(
        `App id format is not correct. Please check naming rules at https://docs.npmjs.com/files/package.json#name`,
      );
    }

    const version: string = semver.valid(this.package.version);
    if (!version) {
      throw new AppInitError(
        `App version format is not correct. Please check format requirements at http://semver.org/`,
      );
    }

    if (!this.config.apiKey) {
      throw new AppInitError('Api key is not defined');
    }

    this.ip = this.config.ip;
    this.port = this.config.port;
    this.id = this.package.name;
    this.version = this.package.version;

    this.api = new ApiRpc(
      {
        id: this.id,
        version: this.version,
      },
      this,
      this.config,
    );

    this.app = new Koa();
    this.router = new Router();

    this.app.use(koaLogger());
    this.app.use(
      koaBodyParser({
        formLimit: '100mb',
        jsonLimit: '100mb',
        textLimit: '100mb',
      }),
    );

    this.app.use(async (ctx, next) => {
      try {
        await next();

        if (ctx.status >= 400 && ctx.status <= 599) {
          let { message } = ctx.response;
          let data = {};

          if (ctx.response.body) {
            if (typeof ctx.response.body === 'string') {
              message = ctx.response.body;
            } else if (typeof ctx.response.body === 'object') {
              data = ctx.response.body;

              if (typeof data.message === 'string' && data.message) {
                ({ message } = data);
                delete data.message;
              }
            }
          }

          throw createError(ctx.status, message, data);
        }
      } catch (err) {
        err.status = err.status || 500;
        err.properties = err.properties || {};

        ctx.status = err.status;
        ctx.body = {
          status: ctx.status,
          message: err.message,
          ...err.properties,
        };

        if (err.status >= 500) {
          ctx.app.emit('error', err, ctx);
        }
      }
    });

    this.router.get('/health-check', ctx => {
      ctx.body = { message: 'OK' };
    });

    this.schemas = {};
    this.importers = {};
    this.controllers = {};
    this.proxies = {};

    debug('app initialized: %s:%s', this.id, this.version);
  }

  /**
   * Registers schema for App.
   * Sends schema to API once App is being registered.
   *
   * @param {string} name Schema name.
   * @param {Object} schema Schema data.
   */
  registerSchema(name: string, schema: Object) {
    if (!/^[A-z0-9]+$/.test(name)) {
      throw new SchemaRegisterError('Schema name format is not correct');
    }

    if (this.schemas[name]) {
      throw new SchemaRegisterError(`Schema ${name} is already registered`);
    }

    // TODO: check if schema is valid

    this.schemas[name] = schema;

    debug('schema registered: %s', name);
  }

  /**
   * Registers importer for App.
   * Sends importer to API once App is being registered.
   *
   * @param {string} name Importer name.
   * @param {Importer} ImporterClass Importer class.
   */
  registerImporter(name: string, ImporterClass: any) {
    if (!/^[A-z0-9.-]+$/.test(name)) {
      throw new ImporterRegisterError('Importer name format is not correct');
    }

    if (this.importers[name]) {
      throw new ImporterRegisterError(`Importer ${name} is already registered`);
    }

    if (!isClass(ImporterClass)) {
      throw new ImporterRegisterError(
        'Importer should be a ES6 class declaration',
      );
    }

    const importerInstance = new ImporterClass(this.config, this);

    if (!Object.keys(importerInstance.authStages).length) {
      throw new ImporterRegisterError('No auth stages defined');
    }

    this.importers[name] = { Class: ImporterClass, instance: importerInstance };

    const authStages = importerInstance.getAuthStages();
    Object.keys(authStages).forEach(stageId => {
      const stage = authStages[stageId];

      this.router.post(`/import/${name}/auth/${stageId}`, async ctx => {
        try {
          const { body } = ctx.request;

          if (!body.id || typeof body.id !== 'string') {
            throw new ImporterInitError('Collect session id is not defined');
          }

          if (!body.state || typeof body.state !== 'object') {
            throw new ImporterInitError('State is not defined');
          }

          if (!body.credentials || typeof body.credentials !== 'object') {
            throw new ImporterInitError('Credentials are not defined');
          }

          const importer = new ImporterClass(body.id, this.api, this.config);
          importer.deserializeState(body.state);

          await stage.validateCredentials(body.credentials);

          const stageResult = await importer[`${stageId}AuthStage`](
            body.credentials,
          );

          ctx.body = {
            nextStage: stageResult ? stageResult.nextStage : null,
            state: importer.serializeState(),
          };
        } catch (e) {
          throw new CollectorAuthError(e.message);
        }
      });
    });

    this.router.post(`/import/${name}/collect`, async ctx => {
      try {
        const { body } = ctx.request;

        if (!body.id || typeof body.id !== 'string') {
          throw new ImporterInitError('Collect session id is not defined');
        }

        if (!body.state || typeof body.state !== 'object') {
          throw new ImporterInitError('State is not defined');
        }

        const importer = new ImporterClass(body.id, this.api, this.config);
        importer.deserializeState(body.state);

        const rawData = await importer.collect();
        const result = await importer.transform(rawData);

        ctx.body = { rawData, result };
      } catch (e) {
        throw new CollectorAuthError(e.message);
      }
    });

    debug('importer registered: %s', name);
  }

  /**
   * Registers controller for App.
   * Sends controller info to API once App is being registered.
   *
   * @param {string} name Controller name.
   * @param {Function} controller Controller function.
   */
  registerController(
    name: string,
    controller: (App, string, Object) => Promise<string>,
  ) {
    if (!/^[A-z0-9.-]+$/.test(name)) {
      throw new ControllerRegisterError(
        'Controller name format is not correct',
      );
    }

    if (this.controllers[name]) {
      throw new ControllerRegisterError(
        `Controller ${name} is already registered`,
      );
    }

    if (typeof controller !== 'function') {
      throw new ControllerRegisterError('Controller function is not provided');
    }

    this.router.get(`/view/${name}`, async ctx => {
      // TODO: validate params

      const view = await controller(this, ctx.headers.accesstoken, ctx.query);

      ctx.body = { view };
    });

    this.controllers[name] = controller;

    debug('controller registered: %s', name);
  }

  registerProxy(name: string, handler: (Object, App, String) => Promise<any>) {
    if (!/^[A-z0-9.-]+$/.test(name)) {
      throw new ProxyRegisterError('Proxy name format is not correct');
    }

    if (this.controllers[name]) {
      throw new ProxyRegisterError(`Proxy ${name} is already registered`);
    }

    if (typeof handler !== 'function') {
      throw new ProxyRegisterError('Proxy handler is not provided');
    }

    this.router.all(`/proxy/${name}`, async ctx => {
      const result = await handler(ctx.request, this, ctx.headers.accesstoken);
      ctx.body = result || '';
    });

    this.proxies[name] = handler;

    debug('proxy registered: %s', name);
  }

  /**
   * Starts App and then registers it on API server.
   * Check if port is busy and finds free port in this case.
   *
   * @return {Promise}
   */
  async start(): Promise<any> {
    this.port = await detect(this.port);

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    const importers = {};
    Object.keys(this.importers).forEach(key => {
      const importer = this.importers[key].instance;

      importers[key] = {
        name: importer.name,
        logo: importer.logo,
        groups: Array.isArray(importer.groups) ? importer.groups : [],
        initialAuthStage: importer.initialAuthStage,
        authStages: importer.authStages,
      };
    });

    await this.api.register(this.ip, this.port, {
      schemas: this.schemas,
      importers,
      controllers: Object.keys(this.controllers),
      proxies: Object.keys(this.proxies),
    });

    exitHook(async callback => {
      await this.api.deregister();
      callback();
    });

    this.app.on('error', err => {
      // eslint-disable-next-line no-console
      console.error('server error', err.stack);
    });

    this.app.listen(this.port);

    // eslint-disable-next-line no-console
    console.log('> service launched on port %s', this.port);
  }

  /**
   * Loads file data and returns it as Data URI.
   * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
   * for details about Data URIs.
   *
   * @param {string} filePath Local file path relative to app root dir.
   * @return {string}
   */
  loadFile(filePath: string): string {
    const mimeType = mime.lookup(filePath);
    const data = fs.readFileSync(path.resolve(this.rootDir, filePath));

    return `data:${mimeType};base64,${data.toString('base64')}`;
  }
}
