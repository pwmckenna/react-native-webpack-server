#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const program = require('commander');
const package = require('../package.json');
const createBundle = require('../lib/createBundle');
const Server = require('../lib/Server');

/**
 * Create a server instance using the provided options.
 * @param  {Object} opts react-native-webpack-server options
 * @return {Server}      react-native-webpack-server server
 */
function createServer(opts) {
  opts.webpackConfigPath = path.resolve(process.cwd(), opts.webpackConfigPath);
  if (fs.existsSync(opts.webpackConfigPath)) {
    opts.webpackConfig = require(path.resolve(process.cwd(), opts.webpackConfigPath));
  } else {
    throw new Error('Must specify webpackConfigPath or create ./webpack.config.js');
  }
  delete opts.webpackConfigPath;

  const server = new Server(opts);
  return server;
}

function commonOptions(program) {
  return program
    .option(
      '-H, --hostname [hostname]',
      'Hostname on which the server will listen. [localhost]',
      'localhost'
    )
    .option(
      '-P, --port [port]', 
      'Port on which the server will listen. [8081]', 
      8081
    )
    .option(
      '-p, --packagerPort [port]',
      'Port on which the react-native packager will listen. [8082]',
      8082
    )
    .option(
      '-w, --webpackPort [port]', 
      'Port on which the webpack dev server will listen. [8083]', 
      8083
    )
    .option(
      '-c, --webpackConfigPath [path]', 
      'Path to the webpack configuration file. [webpack.config.js]', 
      'webpack.config.js'
    )
    .option(
      '-e, --entries [names]',
      'Webpack entry module(s) to be served as \'[name].bundle\'. [index.ios,index.android]',
      val => val.split(','),
      ['index.ios', 'index.android']
    );
}

program.version(package.version);

commonOptions(program.command('start'))
  .description('Start the webpack server.')
  .option('-r, --hot', 'Enable hot module replacement. [false]', false)
  .action(options => {
    const opts = options.opts();
    const server = createServer(opts);
    server.start();
  });

commonOptions(program.command('bundle'))
  .description('Bundle the app for distribution.')
  .option('-i, --ios', 'Create an iOS bundle. [true]', true)
  .option('-a, --android', 'Create an Android bundle. [true]', true)
  .option('-I, --iosEntry [name]', 'iOS entry module name. [index.ios]', 'index.ios')
  .option('-A, --androidEntry [name]', 'Android entry module name. [index.android]', 'index.android')
  .action(options => {
    const opts = options.opts();
    const server = createServer(opts);
    server.start();

    const bundlePromises = _.compact(opts.entries.map(entry =>
      entry === opts.iosEntry ?
        createBundle(server, {
          entryPath: `${opts.iosEntry}.bundle`,
          targetPath: path.resolve('./ios/main.jsbundle'),
        }) :
      entry === opts.androidEntry ?
        createBundle(server, {
          entryPath: `${opts.androidEntry}.bundle`,
          targetPath: path.resolve('./android/app/src/main/assets/index.android.bundle'),
        }) :
      false
    ));

    Promise.all(bundlePromises).then(() => {
      server.stop();

      // XXX: Hack something is keeping the process alive but we can still
      // safely kill here without leaving processes hanging around...
      process.exit(0);
    }).catch(err => {
      console.log('Error creating bundle...', err.stack);
      server.stop();
    });
  });

program.parse(process.argv);
