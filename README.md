# gobem-proc-stylus
This processor for [gobem](https://github.com/Enet/gobem) compiles Stylus files using **stylus** and **nib**. If an argument `no-nib` is passed, **nib** won't be included.

Yet another available option is a path to common file, which will be included to the beginning of each file. Different common files for different languages are supported. This feature is useful to define variables and mixins, which are the same throughout all project.

**gobem-proc-stylus** requires redis database to cache results.

### Example for **build.gb**
```javascript
select 0 ^components\/(\w+)\/\1\.styl$
process gobem-proc-stylus no-nib
// compiles stylus without using nib
write 1

select 0 ^styles\/button\/button\.styl$
process gobem-proc-stylus styles/common/common.styl
// content from 'styles/common/common.styl' will be added
// to the beginning of 'styles/button/button.styl'
write 1

select 0 ^styles\/slider\/slider:en\.styl$
process gobem-proc-stylus styles/common/common.styl
// content from 'styles/common/common.styl' and
// 'styles/common/common:en.styl' will be added
// to the beginning of 'styles/slider/slider:en.styl'
write 1
```
