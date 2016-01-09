'use strict';

let path = require('path'),
    fs = require('fs'),
    async = require('async'),
    redis = require('redis'),
    stylus = require('stylus'),
    nib = require('nib');

module.exports = function (options) {
    options = options || {};

    let client = options.redisClient,
        key = options.redisKey || 'gobem-proc-stylus',
        commonPath = options.commonStylus,
        commonContent = {},
        nibContent = options.noNib ? `` : `@import 'nib';\n`;

    return {
        before: function (next, input, output, config) {
            client = client || redis.createClient(options.redisOptions);
            client.expire(key, 86400);

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

        process: function (next, input, output, config, fileContent, filePath) {
            if (!fileContent) return next();
            let fileLangName = (path.basename(filePath).match(/:(\w+)$/) || {})[1];
            if (commonContent[fileLangName]) fileContent = commonContent[fileLangName] + fileContent;
            if (commonContent['']) fileContent = commonContent[''] + fileContent;
            fileContent = nibContent + fileContent;

            client.hget(key, fileContent, function (error, reply) {
                if (reply === null) {
                    stylus(fileContent)
                        .set('filename', filePath)
                        .use(nibContent ? nib() : null)
                        .render(function(error, css) {
                            if (error) return next(error);

                            client.hset(key, fileContent, css, function (error, reply) {
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
            !options.redisClient && client.quit();
            next();
        }
    };
};
