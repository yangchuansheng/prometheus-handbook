var fs = require('fs');
var path = require('path');


module.exports = {
  // Map of hooks
  hooks: {

    "finish" : function () {
      var configOption = this.config.get('pluginsConfig')['favicon-plus'];
      var output = configOption ? (configOption.output || '_book') : '_book';

      // favicon
      var pathFile = configOption && configOption.favicon;
      if (pathFile) {
        var favicon = path.join(process.cwd(), pathFile);
        var gitbookFaviconPath = path.join(process.cwd(), output, 'gitbook', 'images', 'favicon.ico');
        if (fs.existsSync(pathFile) && fs.existsSync(gitbookFaviconPath)){
          fs.writeFileSync(gitbookFaviconPath, fs.readFileSync(pathFile));
        } else {
          console.error('set favicon failed: favicon or output`s path was wrong!')
        }
      }

      // appleTouchIconPrecomposed152
      var pathFile = configOption && configOption.appleTouchIconPrecomposed152;
      if (pathFile) {
        var appleTouchIconPrecomposed152 = path.join(process.cwd(), pathFile);
        var gitbookAppleTouchPath = path.join(process.cwd(), output, 'gitbook', 'images', 'apple-touch-icon-precomposed-152.png');
        if (pathFile && fs.existsSync(pathFile) && fs.existsSync(gitbookAppleTouchPath)){
          fs.writeFileSync(gitbookAppleTouchPath, fs.readFileSync(pathFile));
        } else {
          console.error('set appleTouchIconPrecomposed152 failed: appleTouchIconPrecomposed152 or output`s path was wrong!')
        }
      }
    }
  },

  // Map of new blocks
  blocks: {},

  // Map of new filters
  filters: {}
};
