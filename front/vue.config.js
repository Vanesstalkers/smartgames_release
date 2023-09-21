const { defineConfig } = require('@vue/cli-service');
const path = require('path');

const resolve = (dir) => path.join(__dirname, dir);

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: (config) => {
    config.resolve.alias['~'] = resolve('./../application');
  },
  outputDir:
    process.env.NODE_ENV === 'development' ? path.resolve('C:/OSPanel_new/OSPanel/domains/smartgames') : 'dist',
});
