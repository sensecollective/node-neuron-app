const path = require('path');
const chalk = require('chalk');
const spawn = require('cross-spawn');

const app = require.resolve(process.cwd());
const nodemonBin = path.resolve(__dirname, '../node_modules/.bin/nodemon');
const buildCmd = path.resolve(__dirname, 'build.js');
const lintCmd = path.resolve(__dirname, 'lint.js');

const toSpawn = [
  {
    label: 'APP',
    color: 'bgGreen',
    cmd: `${nodemonBin} --watch lib ${app}`,
  },
  {
    label: 'BUILD',
    color: 'bgBlue',
    cmd: `${process.argv[0]} ${buildCmd} --watch`,
  },
  {
    label: 'LINT',
    color: 'bgYellow',
    cmd: `${process.argv[0]} ${lintCmd} --watch`,
  },
];

const result = spawn.sync(
  require.resolve('concurrently'),
  [
    '-n',
    toSpawn.map(s => s.label).join(','),
    '-c',
    toSpawn.map(s => s.color).join(','),
    '--allow-restart',
    ...toSpawn.map(s => `"${s.cmd}"`),
  ],
  {
    stdio: ['ignore', process.stdout, 'pipe'],
  },
);

if (result.error || result.status > 0) {
  console.error(chalk.red(result.error || result.stderr.toString())); // eslint-disable-line no-console
  process.exit(result.error ? 1 : result.status);
}
