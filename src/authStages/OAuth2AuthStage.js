// @flow

import {
  AuthStageInitError,
  AuthStageCredentialsValidationError,
} from '../errors';
import { BaseAuthStage } from './BaseAuthStage';

/**
 * OAuth2 auth stage.
 */
export class OAuth2AuthStage extends BaseAuthStage {
  options: {
    oauth2Url: string,
    params: {
      redirect_uri: string,
      response_type: string,
      client_id: string,
      scope: string,
      select_profile: string,
    },
  };

  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.logo
   * @param {string} options.oauth2Url
   * @param {Object} options.params
   * @param {string} options.params.redirect_uri
   * @param {string} options.params.response_type
   * @param {string} options.params.client_id
   * @param {string} options.params.scope
   * @param {string} options.params.select_profile
   */
  constructor(
    baseOptions: {
      title: string,
      logo: string,
    },
    options: {
      oauth2Url: string,
      params: {
        redirect_uri: string,
        response_type: string,
        client_id: string,
        scope: string,
        select_profile: string,
      },
    },
  ) {
    super('oauth2', baseOptions);

    if (!options.oauth2Url) {
      throw new AuthStageInitError('Auth stage OAuth2 URL is not defined');
    }

    if (!options.params || typeof options.params !== 'object') {
      throw new AuthStageInitError('Auth stage OAuth2 params are not defined');
    }

    [
      'redirect_uri',
      'response_type',
      'client_id',
      'scope',
      'select_profile',
    ].forEach(paramName => {
      if (
        !options.params[paramName] ||
        typeof options.params[paramName] !== 'string'
      ) {
        throw new AuthStageInitError(
          `Required field params.${paramName} is not defined for auth stage`,
        );
      }
    });

    this.options = {
      oauth2Url: options.oauth2Url,
      params: options.params,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  validateCredentials(credentials: Object) {
    if (!credentials.authCode || typeof credentials.authCode !== 'string') {
      throw new AuthStageCredentialsValidationError(
        'Required field "authCode" is empty',
      );
    }
  }
}
