'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirp = Promise.promisifyAll(require('mkdirp'));
const path = require('path');
const url = require('url');
const fetch = require('./fetch');

/**
 * Fetch a bundle from the server and write it to file.
 * @param  {Server} server     An instance of a server
 * @param  {Object} options    Options
 * @param  {String} bundlePath The path to the bundle on the server
 * @param  {String} targetPath The destination path where the bundle will be written
 * @return {Promise}           Resolved when the bundle is written to the target path
 */
module.exports = function createBundle(server, options) {
  const bundleUrl = url.format({
    protocol: 'http', 
    hostname: server.hostname, 
    port: server.port, 
    pathname: options.bundlePath,
  });
  return fetch(bundleUrl).then(content =>
    mkdirp.mkdirpAsync(path.dirname(options.targetPath)).then(() =>
      fs.writeFileAsync(options.targetPath, content)
    )
  );
};
