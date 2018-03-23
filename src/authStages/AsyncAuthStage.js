// @flow

import { BaseAuthStage } from './BaseAuthStage';

/**
 * Async auth stage.
 */
export class AsyncAuthStage extends BaseAuthStage {
  constructor() {
    super('async', { title: 'Async', logo: '-' });
  }
}
