'use strict';

let path = require('path'),
    fs = require('fs'),
    async = require('async'),
    xxhash = global[Symbol.for('xxhash')] = global[Symbol.for('xxhash')] || require('xxhash'),
    stylus = require('stylus'),
    nib = require('nib');

module.exports = function (options) {
    options = options || {};

    let commonPath = options.commonStylus,
        commonContent = {},
        nibContent = options.noNib ? `` : `@import 'nib';\n`;

    return {
        before: function (next, input, output, config) {
            if (commonPath) {
                let commonFileExt = path.extname(commonPath) || '.styl',
                    commonFileName = path.basename(commonPath, commonFileExt),
                    commonDir = path.join(config.rootDir, path.dirname(commonPath));
                async.each(config.buildLangs, (langName, langNext) => {
                    let commonFilePath = path.join(commonDir, commonFileName + (langName ? `:${langName}` : ``) + commonFileExt);
                    fs.readFile(commonFilePath, 'utf-8', (error, fileContent) => {
                        commonContent[langName] = error ? '' : fileContent + '\n';
                        langNext();
                    });
                }, next);
            } else {
                next();
            }
        },

        process: function (next, input, output, config, rawContent, rawPath) {
            if (!rawContent) return next();
            let fileLangName = (path.basename(rawPath).match(/:(\w+)$/) || {})[1];
            if (commonContent[fileLangName]) rawContent = commonContent[fileLangName] + rawContent;
            if (commonContent['']) rawContent = commonContent[''] + rawContent;
            rawContent = nibContent + rawContent;

            let key = xxhash.hash(new Buffer(rawContent), 0xCAFEBABE) + '',
                filePath = path.join(options.cacheDir + '', 'gobem-proc-stylus^' + key);

            fs.readFile(filePath, 'utf8', (error, fileContent) => {
                if (error) {
                    stylus(rawContent)
                        .set('filename', rawPath)
                        .use(nibContent ? nib() : null)
                        .render(function (error, css) {
                            if (error) return next(error);

                            output.set(rawPath + '.css', css);
                            fs.writeFile(filePath, css, next);
                        });
                } else {
                    output.set(rawPath + '.css', fileContent);
                    next();
                }
            });
        }
    };
};
