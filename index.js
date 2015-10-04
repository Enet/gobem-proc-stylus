'use strict';

let path = require('path'),
    fs = require('fs'),
    async = require('async'),
    redis = require('redis'),
    stylus = require('stylus'),
    nib = require('nib')();

module.exports = function () {
    let client,
        common;

    return {
        before: function (next, input, output, args) {
            client = client.createClient();
            client.expire('stylus', 86400);
            common = {};
            if (args[1]) {
                let commonFileExt = path.extname(args[1]) || '.styl',
                    commonFileName = path.basename(args[1], commonFileExt),
                    commonDir = path.join(args.config.rootDir, path.dirname(args[1]));
                async.each(args.config.buildLangs, (langName, langNext) => {
                    let filePath = path.join(commonDir, commonFileName + (langName ? `:${langName}` : ``) + commonFileExt);
                    fs.access(filePath, fs.R_OK, error => {
                        if (!error) common[langName] = filePath;
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
            if (common[fileLangName]) fileContent = `@import '${common[fileLangName]}';\n${fileContent}`;
            if (common['']) fileContent = `@import '${common['']}';\n${fileContent}`;

            client.hget('stylus', fileContent, function (error, reply) {
                if (reply === null) {
                    stylus(fileContent)
                        .set('filename', filePath)
                        .use(nib)
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

        after: function (next) {
            client.end();
            next();
        }
    };
};