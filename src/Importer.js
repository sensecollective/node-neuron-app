// @flow

import { BaseAuthStage } from './authStages/BaseAuthStage';
import { CollectorCollectError, ImporterRegisterError } from './errors';
import { ApiRpc } from './ApiRpc';

/**
 * Importer definition class.
 */
export class Importer {
  id: string;
  api: ApiRpc;
  options: Object;
  authStages: Object;
  initialAuthStage: string;
  currentStage: string;
  state: Object;
  transformer: Object => Object;
  onStatusUpdate: string => Promise<void>;

  constructor(id: string, api: ApiRpc, options: Object = {}) {
    this.id = id;
    this.api = api;
    this.options = options;

    this.authStages = {};
    this.initialAuthStage = '';
    this.state = {};
  }

  getAuthStages(): Object {
    if (!Object.keys(this.authStages).length) {
      throw new ImporterRegisterError('No auth stages defined');
    }

    return this.authStages;
  }

  async setStatus(text: string) {
    this.api.updateImporterStatus(this.id, text);
  }

  setState(key: string, value: Object) {
    this.state[key] = value;
  }

  serializeState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  deserializeState(state: Object) {
    this.state = JSON.parse(JSON.stringify(state));
  }

  setInitialAuthStage(id: string) {
    if (!this.authStages[id]) {
      throw new ImporterRegisterError(`Auth stage "${id}" is not defined`);
    }

    this.initialAuthStage = id;
  }

  addAuthStage(id: string, stage: BaseAuthStage) {
    if (this.authStages[id]) {
      throw new ImporterRegisterError(
        `Auth stage "${id}" cannot be defined twice`,
      );
    }

    const _this: Object = this;
    const stageFn = _this[`${id}AuthStage`];
    if (typeof stageFn !== 'function') {
      throw new ImporterRegisterError(
        `Auth stage "${id}" does not have corresponding method in importer`,
      );
    }

    this.authStages[id] = stage;

    if (!this.initialAuthStage) {
      this.initialAuthStage = id;
    }
  }

  // eslint-disable-next-line
  collect(): Promise<any> {
    throw new CollectorCollectError('collect method is not implemented');
  }

  // eslint-disable-next-line
  transform(rawData: any): Promise<Object> {
    throw new CollectorCollectError('transform method is not implemented');
  }
}
