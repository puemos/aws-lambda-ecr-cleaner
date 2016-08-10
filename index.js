'use strict';
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const R = require('ramda');
const lib = require('./lib');
const config = require('./config');

// Lambda Handler
module.exports.handler = function (event, context) {

    // Check event for dry run, which prevents actual deletion
    // check logs to see what would have been deleted
    console.log(event);
    const ecr = Promise.promisifyAll(new AWS.ECR({ region: config.REGION }));
    const ecs = Promise.promisifyAll(new AWS.ECS({ region: config.ECS_REGION }));

    if (Array.isArray(config.REPO_TO_CLEAN)) {
        const tasks = config.REPO_TO_CLEAN
            .map(repoName => {
                const config_repo = Object.assign({}, config, {
                    REPO_TO_CLEAN: repoName
                });
                return run(config_repo, ecr, ecs)
            })
        return Promise.all(tasks)
            .then(context.succeed)
            .catch(context.fail);
    }

    return run(config, ecr, ecs)
        .then(context.succeed)
        .catch(context.fail);
};
const run = (config, ecr, ecs) => {
    const emptyArrayFunc = x => [];
    const filterImagesByDateThreshold = config.REPO_AGE_THRESHOLD ? lib.filterImagesByDateThreshold(config, ecr, ecs) : emptyArrayFunc;
    const filterImagesByFirstN = config.REPO_FIRST_N_THRESHOLD ? lib.filterImagesByFirstN(config, ecr, ecs) : emptyArrayFunc;
    return lib.getRepoImages(config, ecr, ecs)
        .then(images => {
            return Promise.all([filterImagesByDateThreshold(images), filterImagesByFirstN(images)])
        })
        .then(images => {
            const res = R.intersection(images[0], images[1])
            return res;
        })
        .then(lib.filterOutActiveImages(config, ecr, ecs))
        .then(lib.deleteImages(config, ecr, ecs))
}
