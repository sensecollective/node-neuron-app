/* eslint no-console: 0 */

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const path = require('path');
const chalk = require('chalk');
const spawn = require('cross-spawn');

const result = spawn.sync(
  path.resolve(process.cwd(), 'node_modules/.bin/prettier'),
  [
    '--write',
    '--single-quote',
    '--trailing-comma',
    'all',
    path.resolve(process.cwd(), 'src/**/*.js'),
  ],
  {
    stdio: ['ignore', process.stdout, 'pipe'],
  },
);

if (result.error || result.status > 0) {
  console.error(chalk.red(result.error || result.stderr.toString()));
  process.exit(result.error ? 1 : result.status);
}
