# gitbook-plugin-favicon
gitbook-plugin-favicon, 可配置目录

## gitbook plugin url

[favicon-plus](https://plugins.gitbook.com/plugin/favicon-plus)

## Install
Add the below to your `book.json` file, then run `gitbook install` in book folder:
```json
{
    "plugins": ["favicon-plus"]
}
```
## config

### book.json
```json
{
    "plugins" : ["favicon-plus"],
    "pluginsConfig" : {
        "favicon": "path to favicon.ico",
        "appleTouchIconPrecomposed152": "path to appleTouchIconPrecomposed152.png",
        "output": "book output path",
    }
}
```
