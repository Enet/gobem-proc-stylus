'use strict';

let path = require('path'),
    fs = require('fs'),
    async = require('async'),
    redis = require('redis'),
    stylus = require('stylus'),
    nib = require('nib');

module.exports = function () {
    let client,
        key = 'stylus',
        commonPath,
        commonContent,
        nibContent;

    return {
        before: function (next, input, output, args) {
            let noNibArgIndex = args.indexOf('no-nib');
            nibContent = ~noNibArgIndex ? `` : `@import 'nib';\n`;
            commonPath = args[noNibArgIndex === 1 ? 2 : 1];

            client = redis.createClient();
            client.expire('stylus', 86400);
            commonContent = {};
            if (commonPath) {
                let commonFileExt = path.extname(commonPath) || '.styl',
                    commonFileName = path.basename(commonPath, commonFileExt),
                    commonDir = path.join(args.config.rootDir, path.dirname(commonPath));
                async.each(args.config.buildLangs, (langName, langNext) => {
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

        process: function (next, input, output, args, fileContent, filePath) {
            if (!fileContent) return next();

            let fileLangName = (path.basename(filePath).match(/:(\w+)$/) || {})[1];
            if (commonContent[fileLangName]) fileContent = commonContent[fileLangName] + fileContent;
            if (commonContent['']) fileContent = commonContent[''] + fileContent;
            fileContent = nibContent + fileContent;

            client.hget('stylus', fileContent, function (error, reply) {
                if (reply === null) {
                    stylus(fileContent)
                        .set('filename', filePath)
                        .use(nibContent ? nib() : null)
                        .render(function(error, css) {
                            if (error) return next(error);

                            client.hset('stylus', fileContent, css, function (error, reply) {
                                output.set(filePath + '.css', css);
                                next(error);
                            });
                        });
                } else {
                    output.set(filePath + '.css', reply);
                    next();
                }
            });
        },

        clear: function (next) {
            client.end();
            next();
        }
    };
};
