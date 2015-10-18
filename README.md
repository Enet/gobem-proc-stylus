# gobem-proc-stylus
This processor for [gobem](https://github.com/Enet/gobem) compiles Stylus files using **stylus** and **nib**. All options are passed as a single object. **gobem-proc-stylus** requires redis database to cache results of the work.

The following options are supported:
* `commonStylus`<br>
A path to common file, which will be included to the beginning of each file. Different common files for different languages are supported. This feature is useful to define variables and mixins, which are the same throughout all project.
* `noNib`<br>
If this flag is `true`, **nib** won't be included in each file.
* `redisKey`<br>
The key in the redis database to store cache. Default value is `gobem-proc-stylus`.
* `redisClient`<br>
Already created redis-client. [This](https://github.com/NodeRedis/node_redis) module is used.
* `redisOptions`<br>
Options for a new redis-client. This field is ignored, if `redisClient` is passed.

### Example for **build.js**
```javascript
module.exports = function () {
    return [

        ['select', 0, /^components\/(\w+)\/\1\.styl$/],
        ['gobem-proc-stylus', {noNib: true}],
        ['write', 1],
        // compiles stylus without using nib

        // buildLangs = [''];
        ['select', 0, /^styles\/button\/button\.styl$/],
        ['gobem-proc-stylus', {commonStylus: 'styles/common/common.styl'}],
        ['write', 1]
        // content from 'styles/common/common.styl' will be added
        // to the beginning of 'styles/button/button.styl'

        // buildLangs = ['', 'ru', 'en'];
        ['select', 0, /^styles\/slider\/slider:en\.styl$/],
        ['gobem-proc-stylus', {commonStylus: 'styles/common/common.styl'}],
        ['write', 1]
        // content from 'styles/common/common.styl' and
        // 'styles/common/common:en.styl' will be added
        // to the beginning of 'styles/slider/slider:en.styl'

    ]; // this array will be used as build instructions
};
```
