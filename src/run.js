const Promise = require('bluebird')
const R = require('ramda')

const Api = require('./api')

const run = (config, ecr, ecs) =>
  Api.getRepoImages(config, ecr, ecs)
    .tap(() => Promise.delay(config.API_DELAY))
    .then(images => Promise.all([Api.filterImagesByDateThreshold(images), Api.filterImagesByFirstN(images)]))
    .then(images => R.intersection(images[0], images[1]))
    .then(Api.filterOutActiveImages(config, ecr, ecs))
    .then(Api.deleteImages(config, ecr, ecs))

module.exports = run
