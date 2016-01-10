# gobem-proc-stylus
This processor for [gobem](https://github.com/Enet/gobem) compiles Stylus files using **stylus** and **nib**. All options are passed as a single object. **gobem-proc-stylus** requires directory to cache results of the work.

The following options are supported:
* `commonStylus`<br>
A path to common file, which will be included to the beginning of each file. Different common files for different languages are supported. This feature is useful to define variables and mixins, which are the same throughout all project.
* `noNib`<br>
If this flag is `true`, **nib** won't be included in each file.
* `cacheDir`<br>
Full path to a readable and writable directory to cache files.

### Example for **build.js**
```javascript
module.exports = function () {
    var cacheDir = '/var/www/gobem/cache';

    return [

        ['select', 0, /^components\/(\w+)\/\1\.styl$/],
        ['gobem-proc-stylus', {
            noNib: true,
            cacheDir: cacheDir
        }],
        ['write', 1],
        // compiles stylus without using nib

        // buildLangs = [''];
        ['select', 0, /^styles\/button\/button\.styl$/],
        ['gobem-proc-stylus', {
            commonStylus: 'styles/common/common.styl',
            cacheDir: cacheDir
        }],
        ['write', 1]
        // content from 'styles/common/common.styl' will be added
        // to the beginning of 'styles/button/button.styl'

        // buildLangs = ['', 'ru', 'en'];
        ['select', 0, /^styles\/slider\/slider:en\.styl$/],
        ['gobem-proc-stylus', {
            commonStylus: 'styles/common/common.styl',
            cacheDir: cacheDir
        }],
        ['write', 1]
        // content from 'styles/common/common.styl' and
        // 'styles/common/common:en.styl' will be added
        // to the beginning of 'styles/slider/slider:en.styl'

    ]; // this array will be used as build instructions
};
```
