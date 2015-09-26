'use strict';

const path = require('path');

/**
 * Extract the React Native module paths
 *
 * @return {Promise<Object>} A promise which resolves with 
 *                           a webpack 'externals' configuration object
 */
function getReactNativeExternals() {
  const reactNativeRoot = path.dirname(require.resolve('react-native/package'));
  const blacklist = require('react-native/packager/blacklist');
  const ReactPackager = require('react-native/packager/react-packager');
  const reactNativePackage = require('react-native/package');

  return ReactPackager.getDependencies({
    assetRoots: [reactNativeRoot],
    blacklistRE: blacklist(false /* don't blacklist any platform */),
    projectRoots: [reactNativeRoot],
    transformModulePath: require.resolve('react-native/packager/transformer'),
  }, reactNativePackage.main).then(dependencies =>
    dependencies.filter(dependency => !dependency.isPolyfill())
  ).then(dependencies =>
    Promise.all(dependencies.map(dependency => dependency.getName()))
  ).then(moduleIds =>
    moduleIds.reduce((externals, moduleId) => {
      externals[moduleId] = 'commonjs ' + moduleId;
      return externals;
    }, {})
  );
}

module.exports = getReactNativeExternals;
