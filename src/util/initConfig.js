// @flow

import path from 'path';
import rc from 'rc';
import dotenv from 'dotenv';

/**
 * Initializes config using rc library and custom params.
 *
 * @param {string} rootDir
 * @param {Object} custom
 * @return {Object}
 */
export function initConfig(rootDir: string, custom: Object = {}): Object {
  dotenv.config({
    path: path.resolve(rootDir, '.env'),
  });

  return rc('neuron-app', {
    logLevel: 'debug',
    ip: '127.0.0.1',
    port: 8000,
    consul: {
      host: '127.0.0.1',
      port: 8500,
    },
    apiUrl: 'http://localhost:7000',
    apiKey: 'please specify real api key',
    custom,
  });
}
