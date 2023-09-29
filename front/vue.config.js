const { defineConfig } = require('@vue/cli-service');
const path = require('path');

const resolve = (dir) => path.join(__dirname, dir);

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'development' ? '/' : '/release/',
  transpileDependencies: true,
  configureWebpack: (config) => {
    config.resolve.alias['~'] = resolve('./../application');
  },
});
