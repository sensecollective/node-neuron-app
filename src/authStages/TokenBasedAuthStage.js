// @flow

import { AuthStageInitError } from '../errors';
import { BaseAuthStage } from './BaseAuthStage';

/**
 * Token based auth stage. Client sends token data that the server can validate.
 * Examples of such usage:
 *  - Human API (token exchange)
 *  - JWT
 */
export class TokenBasedAuthStage extends BaseAuthStage {
  options: {
    tokenData: {},
  };

  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.logo
   * @param {Object} options.tokenData
   * @param {string} options.type
   * @param {string} options.confirmBtnText
   */
  constructor(
    baseOptions: {
      title: string,
      logo: string,
    },
    options: {
      tokenData: {},
      type: string,
      confirmBtnText: string,
    },
  ) {
    super('tokenbased', baseOptions);

    if (!options.tokenData || typeof options.tokenData !== 'object') {
      throw new AuthStageInitError(
        'Token Data is missing for TokenBasedAuth stage',
      );
    }

    if (!options.type || typeof options.type !== 'string') {
      throw new AuthStageInitError('type is missing for TokenBasedAuth stage');
    }

    this.options = {
      tokenData: options.tokenData,
      type: options.type,
      confirmBtnText: options.confirmBtnText || 'Connect',
    };
  }
}
