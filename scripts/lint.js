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

const watch = process.argv.includes('--watch');
const fix = process.argv.includes('--fix');

const eslintBin = path.resolve(__dirname, '../node_modules/.bin/eslint');
const nodemonBin = path.resolve(__dirname, '../node_modules/.bin/nodemon');

const eslintConfig = path.resolve(__dirname, '../.eslintrc.yaml');

let result;
if (watch) {
  result = spawn.sync(
    nodemonBin,
    [
      '--watch',
      'src/',
      '--exec',
      `${eslintBin} --quiet ${fix ? '--fix' : null} src`,
    ],
    {
      stdio: ['ignore', process.stdout, 'pipe'],
    },
  );
} else {
  result = spawn.sync(
    eslintBin,
    ['--quiet', '--config', eslintConfig, fix ? '--fix' : null, 'src/'].filter(
      Boolean,
    ),
    {
      stdio: ['ignore', process.stdout, 'pipe'],
    },
  );
}

if (result.error || result.status > 0) {
  console.error(chalk.red(result.error || result.stderr.toString()));
  process.exit(result.error ? 1 : result.status);
}
