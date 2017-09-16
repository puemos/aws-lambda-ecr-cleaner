const Promise = require('bluebird')
const R = require('ramda')

const Api = require('./api')

const chooseByConfig = config => images => {
  if (config.REPO_FIRST_N_THRESHOLD && config.REPO_AGE_THRESHOLD) {
    return R.intersection(images[0], images[1])
  }
  if (config.REPO_AGE_THRESHOLD) {
    return images[0]
  }
  if (config.REPO_FIRST_N_THRESHOLD) {
    return images[1]
  }
}

/**
 * 
 * 
 * @param {Config} config 
 * @param {any} ecr 
 * @param {any} ecs 
 */
const run = (config, ecr, ecs) =>
  Api.getRepoImages(config, ecr, ecs)
    .tap(() => Promise.delay(config.API_DELAY))
    .then(images =>
      Promise.all([
        Api.filterImagesByDateThreshold(config, ecr, images),
        Api.filterImagesByFirstN(config, ecr, images)
      ])
    )
    .tap(console.log)
    .then(chooseByConfig(config))
    .then(Api.filterOutActiveImages(config, ecr, ecs))
    .then(Api.deleteImages(config, ecr, ecs))

module.exports = run
