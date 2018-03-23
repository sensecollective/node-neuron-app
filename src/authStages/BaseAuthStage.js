// @flow

import { AuthStageInitError } from '../errors';

/**
 * Base class to define different auth stage types.
 */
export class BaseAuthStage {
  title: string;
  logo: string;
  type: string;
  options: Object;

  /**
   * @param {string} id Stage id.
   * @param {Object} options Stage options.
   */
  constructor(
    type: string,
    options: {
      title: string,
      logo: string,
    },
  ) {
    if (!type || typeof type !== 'string') {
      throw new AuthStageInitError('Auth stage type is not defined');
    }

    if (!options || typeof options !== 'object') {
      throw new AuthStageInitError('Auth stage options are not defined');
    }

    if (!options.title || typeof options.title !== 'string') {
      throw new AuthStageInitError('Auth stage title is not defined');
    }

    if (!options.logo || typeof options.logo !== 'string') {
      throw new AuthStageInitError('Auth stage logo is not defined');
    }

    this.title = options.title;
    this.logo = options.logo;
    this.type = type;
    this.options = {};
  }

  getOptions(): Object {
    return {
      title: this.title,
      logo: this.logo,
      type: this.type,
      options: this.options,
    };
  }

  // eslint-disable-next-line
  validateCredentials(credentials: Object) {}
}
