// @flow

/**
 * Base class to define different auth stage types.
 */
export class ImportAuthStage {
  title: string;
  type: string;
  options: Object;
  data: Object;

  /**
   * @param {string} id Stage id.
   * @param {Object} options Stage options.
   */
  constructor() {
    this.title = 'rawJSON';
    //    this.logo = options.logo;
    this.data = {};
    this.type = 'rawJSON';
    this.options = {};
  }

  getOptions(): Object {
    return {
      title: this.title,
      //      logo: this.logo,
      type: this.type,
      options: this.options,
      data: this.data,
    };
  }

  // eslint-disable-next-line
  validateCredentials(credentials: Object) {}
}
