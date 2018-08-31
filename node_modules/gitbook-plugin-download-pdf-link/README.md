# Gitbook plugin download-pdf-link
GitBook Plugin to add a link on every page to download PDF.

To use this plugin, you have to modify your book.json configuration file.
```js
{
  "plugins": ["download-pdf-link"],
  "pluginsConfig": {
    "download-pdf-link": {
      "base": "https://www.gitbook.com/book/poppy-project/poppy-docs/",
      "label": {
          "en": "Download PDF",
          "fr": "Télécharger le PDF"
      }
    }
  }
}
```
If you are trying it on your desktop, run `gitbook install` to download and install the plugin, and `gitboook serve .` to run the rendering.

To see this plugin in action, you can see [this example](https://docs.poppy-project.org).



----
This plugin comes from the original plugin [gitbook-plugin-downloadpdf](https://www.npmjs.com/package/gitbook-plugin-download-pdf) which was broken for multilingual books.
