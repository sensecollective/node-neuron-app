// @flow

import { AuthStageInitError } from '../errors';

/**
 * Base class to define different auth stage types.
 */
export class FacebookTokenAuthStage {
  token: string;
  type: string;
  options: Object;

  /**
   * @param {string} id Stage id.
   * @param {Object} options Stage options.
   */
  constructor(options: { token: string }) {
    if (!options || typeof options !== 'object') {
      throw new AuthStageInitError('Auth stage options are not defined');
    }

    /*
    if (!options.logo || typeof options.logo !== 'string') {
      throw new AuthStageInitError('Auth stage logo is not defined');
    }
   */

    //    this.logo = options.logo;
    this.type = 'facebook';
    this.options = {};
  }

  getOptions(): Object {
    return {
      token: this.token,
      options: this.options,
    };
  }

  // eslint-disable-next-line
  validateCredentials(credentials: Object) {}
}
