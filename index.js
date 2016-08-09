'use strict';

const lib = require('./lib');
const config = require('./config');

// Lambda Handler
module.exports.handler = function (event, context) {

    // Check event for dry run, which prevents actual deletion
    // check logs to see what would have been deleted
    console.log(event);

    var params = {
        repositoryName: config.REPO_TO_CLEAN
    };

    lib.getRepoImages(params)
        .then(lib.filterImagesByDateThreshold)
        .then(lib.filterOutActiveImages)
        .then(lib.deleteImages)
        .then(context.succeed)
        .catch(context.fail);
};
