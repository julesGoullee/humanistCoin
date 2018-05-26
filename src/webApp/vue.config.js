module.exports = {
  lintOnSave: false,
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.mode = 'production';
    } else {
      config.mode = 'development';
    }
  }
};
