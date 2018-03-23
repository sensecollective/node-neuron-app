// @flow

import {
  AuthStageInitError,
  AuthStageCredentialsValidationError,
} from '../errors';
import { BaseAuthStage } from './BaseAuthStage';

/**
 * Simple form auth stage.
 */
export class FormAuthStage extends BaseAuthStage {
  options: {
    fields: Object[],
    confirmBtnText: string,
  };

  /**
   * @param {string} type
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.logo
   * @param {string} options.confirmBtnText
   * @param {Object[]} options.fields
   */
  constructor(
    baseOptions: {
      title: string,
      logo: string,
    },
    options: {
      fields: { type: string, name: string }[],
      confirmBtnText: string,
    },
  ) {
    super('form', baseOptions);

    if (!Array.isArray(options.fields)) {
      throw new AuthStageInitError('Expected auth stage fields to be an array');
    }

    const fieldsNames = [];

    options.fields.forEach(field => {
      if (fieldsNames.includes(field.name)) {
        throw new AuthStageInitError(
          `Field '${field.name}' cannot be defined twice`,
        );
      }

      if (!field.name || typeof field.name !== 'string') {
        throw new AuthStageInitError(`Field name is not defined`);
      }

      if (!field.type || typeof field.type !== 'string') {
        throw new AuthStageInitError(
          `Field type is not defined for field ${field.name}`,
        );
      }

      if (!['text', 'password'].includes(field.type)) {
        throw new AuthStageInitError(
          `Field type "${field.type}" is not supported (field ${field.name})`,
        );
      }

      fieldsNames.push(field.name);
    });

    this.options = {
      fields: options.fields,
      confirmBtnText: options.confirmBtnText || 'Submit',
    };
  }

  validateCredentials(credentials: Object) {
    this.options.fields.forEach(field => {
      if (field.required !== false) {
        if (
          !credentials[field.name] ||
          typeof credentials[field.name] !== 'string'
        ) {
          throw new AuthStageCredentialsValidationError(
            `Required field "${field.name}" is empty`,
          );
        }
      }
    });
  }
}
