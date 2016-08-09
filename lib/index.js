'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const _ = require('lodash');
const config = require('../config')

const ecr = Promise.promisifyAll(new AWS.ECR({ region: config.REGION }));
const ecs = Promise.promisifyAll(new AWS.ECS({ region: config.ECS_REGION }));

/**
 * Lib
 */

function getImageAgeDays(timestamp) {

    const y = parseInt(timestamp.split('-')[0]);
    const m = parseInt(timestamp.split('-')[1]) - 1;
    const d = parseInt(timestamp.split('-')[2].split('T')[0]);
    const h = parseInt(timestamp.split('T')[1].split(':')[0]);

    const age = Date.now() - Date.UTC(y, m, d, h);
    const days = 1000 * 60 * 60 * 24;
    age = Math.round(age / days);

    return (age);
}

exports.getRepoImages = function (params) {
    return ecr.listImagesAsync(params);
};

// Takes an argument of an array of full image definitions
//   and splits into tags to delete from the REPO_TO_CLEAN repo
exports.deleteImages = function (images) {
    return new Promise(function (resolve) {
        console.info('IMAGES TO DELETE:', images);
        var imageTagsToDelete = _.map(images, function (image) {
            return { imageTag: image.split(':')[1] };
        });

        console.info('IMAGE TAGS TO DELETE:', imageTagsToDelete);

        // Make sure we are doing this for real
        if (config.DRY_RUN !== 'true') {
            if (imageTagsToDelete.length > 0) {
                const params = {
                    imageIds: imageTagsToDelete,
                    repositoryName: config.REPO_TO_CLEAN
                };

                // Batch delete all images in the deletionQueue
                ecr.batchDeleteImageAsync(params)
                    .then(function (deletions) {
                        resolve({
                            failures: deletions.failures,
                            imagesDeleted: deletions.imageIds,
                            count: _.keys(deletions.imageIds)
                                .length
                        });
                    });
            } else {
                resolve({
                    failures: [],
                    imagesDeleted: [],
                    count: 0
                });
            }
        } else {
            // Fake Results
            resolve({
                dryRun: true,
                failures: [],
                imagesDeleted: imageTagsToDelete,
                count: imageTagsToDelete.length
            });
        }
    });
};

// Goes through all of ECS in a particular region and determines what is still
//   marked as active and in use containers at a Task level (not actual running tasks)
exports.filterOutActiveImages = function (eligibleForDeletion) {
    console.info('BEFORE FILTER:', eligibleForDeletion);

    return ecs.listTaskDefinitionsAsync({ status: 'ACTIVE' })
        .then(function (taskDefs) {
            return new Promise(function (resolve) {
                Promise.map(taskDefs.taskDefinitionArns, function (taskDefinitionARN) {

                        // Get all active images from all container defintions
                        return ecs.describeTaskDefinitionAsync({ taskDefinition: taskDefinitionARN })
                            .then(function (taskDefinitionDetails) {
                                return _.chain(taskDefinitionDetails)
                                    .map(function (taskDefinitionDetail) {
                                        return taskDefinitionDetail.containerDefinitions;
                                    })
                                    .map(function (containerDefinition) {
                                        return _.map(containerDefinition, 'image');
                                    })
                                    .value();
                            });
                    })
                    .then(resolve);
            });
        })
        .then(function (allImages) {
            // Then reduce the big array and reduce to uniq values
            const activeImages = _.chain(allImages)
                .flattenDeep()
                .uniq()
                .value();
            console.log('ACTIVE IMAGES:', activeImages);

            // Remove images from deletion that are active
            return _.difference(eligibleForDeletion, activeImages);
        });
};

// Fetch all layers / image details from the repo
// Filter out everything newer than some variable amount of days
//   set via REPO_AGE_THRESHOLD (90 days by default)
exports.filterImagesByDateThreshold = function (images) {
    console.info('IMAGES TO PROCESS:', images);
    const params = {
        imageIds: images.imageIds,
        repositoryName: config.REPO_TO_CLEAN
    };

    return ecr.batchGetImageAsync(params)
        .then(function (imageDetails) {

            // Get all tags eligible for deletion by age threshold
            //   coerce each of the tags to a full image reference for easy comparison
            var eligibleForDeletion = _.map(imageDetails.images, function (image) {

                var created = JSON.parse(JSON.parse(image.imageManifest)
                        .history[0]
                        .v1Compatibility)
                    .created;

                var imageTag = JSON.parse(image.imageManifest)
                    .tag;

                if (created &&
                    imageTag !== 'latest' &&
                    getImageAgeDays(created) >= config.REPO_AGE_THRESHOLD) {
                    return config.AWS_ACCOUNT_ID +
                        '.dkr.ecr.' +
                        config.REGION +
                        '.amazonaws.com/' +
                        config.REPO_TO_CLEAN +
                        ':' + imageTag;
                } else {
                    return null;
                }
            });

            return _.compact(eligibleForDeletion);
        });
};
