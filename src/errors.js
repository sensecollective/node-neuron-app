// @flow

import createError from 'create-error';

function createErrors(names: string[]): Object {
  const errors = {};

  names.forEach(name => {
    errors[name] = createError(name);
    errors[name].code = 400;
    errors[name].statusCode = errors[name].code;
  });

  return errors;
}

module.exports = createErrors([
  'AppInitError',
  'AuthStageInitError',
  'AuthStageCredentialsValidationError',
  'CollectorAuthError',
  'CollectorCollectError',
  'ControllerRegisterError',
  'ImporterInitError',
  'ImporterRegisterError',
  'ProxyRegisterError',
  'SchemaRegisterError',
  'TransformDataFormatError',
  'TransformDataTypeError',
]);
