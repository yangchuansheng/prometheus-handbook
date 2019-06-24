require(["gitbook", "jQuery"], function(gitbook, $) {
  gitbook.events.bind('start', function (e, config) {
    var conf = config['download-pdf-link'];
    var lang = gitbook.state.innerLanguage;
    var label = conf.label;
    if (lang) {
       // label can be a unique string for multi-languages site
       if (typeof label === 'object') label = label[lang];
   }
    var base = conf.base
    var multilingual = conf.multilingual || false

    if (base.slice(-1) !== "/") {
      base += "/"
    }

    gitbook.toolbar.createButton({
      icon: 'fa fa-file-pdf-o',
      text: label,
      onClick: function() {
        window.open(base + "?lang=" + lang)
      }
    })
  })
})
