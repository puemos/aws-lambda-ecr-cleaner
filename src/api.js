const Promise = require('bluebird')
const R = require('ramda')

/**
 *  Create a repo Url by the config and imageTag
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @returns {AWS.ECR.Url}
 */
const createRepoUrl = R.curry(
  (config, imageTag) =>
    `${config.AWS_ACCOUNT_ID}.dkr.ecr.${config.REGION}.amazonaws.com/${config.REPO_TO_CLEAN}:${imageTag}`
)

/**
 * Convert ts to days
 *
 * @param {Date} date
 * @returns {number} number of days
 */
function getImageAgeDays (date) {
  const age = Date.now() - date.getTime()
  const days = 1000 * 60 * 60 * 24
  return Math.round(age / days)
}

/**
 *
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const getRepoImages = (config, ecr) => {
  const params = {
    repositoryName: config.REPO_TO_CLEAN
  }
  return ecr
    .listImages(params)
    .promise()
    .then(R.prop('imageIds'))
}

/**
 * Takes an argument of an array of full image definitions
 * and splits into tags to delete from the REPO_TO_CLEAN repo
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @param {AWS.ECR.ImageIdentifierList} images Array of images names to be deleted
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const deleteImages = (config, ecr, images) => {
  const batchImages = R.splitEvery(99, images)
  return Promise.map(
    batchImages,
    imagesChunk =>
      new Promise(resolve => {
        console.info('IMAGES TO DELETE:', imagesChunk)
        const imageTagsToDelete = imagesChunk.map(image => ({
          imageTag: image.split(':')[1]
        }))

        console.info('IMAGE TAGS TO DELETE:', imageTagsToDelete)

        // Make sure we are doing this for real
        if (config.DRY_RUN || R.isEmpty(imageTagsToDelete)) {
          resolve({
            failures: [],
            imagesDeleted: [],
            count: 0
          })
        }

        const params = {
          imageIds: imageTagsToDelete,
          repositoryName: config.REPO_TO_CLEAN
        }

        // Batch delete all images in the deletionQueue
        ecr
          .batchDeleteImage(params)
          .promise()
          .then(deletions => {
            resolve({
              failures: deletions.failures,
              imagesDeleted: deletions.imageIds,
              count: R.keys(deletions.imageIds).length
            })
          })
      })
  )
}

/**
 * Goes through all of ECS in a particular region and determines what is still
 * marked as active and in use containers at a Task level (not actual running tasks)
 *
 * @param {AWS.ECS} ecs ECS API
 * @param {Array<AWS.ECS.TaskDefinition>} taskDefs Array of images to be filtered by active
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const getAllImagesTagsByTaskDef = R.curry(
  (ecs, taskDefs) =>
    new Promise(resolve => {
      Promise.map(taskDefs.taskDefinitionArns, taskDefinitionARN =>
        // Get all active images from all container defintions
        ecs
          .describeTaskDefinition({ taskDefinition: taskDefinitionARN })
          .promise()
          // .tap(() => Promise.delay(config.API_DELAY))
          .then(R.pathOr([], ['taskDefinition', 'containerDefinitions']))
          .then(containerDefinitions => containerDefinitions.map(R.prop('image')))
          .then(resolve)
      )
    })
)

/**
 * Goes through all of ECS in a particular region and determines what is still
 * marked as active and in use containers at a Task level (not actual running tasks)
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @param {AWS.ECS} ecs ECS API
 * @param {Array<string>} eligibleForDeletion Array of images to be filtered by active
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const filterOutActiveImages = (config, ecr, ecs, eligibleForDeletion) => {
  console.info('BEFORE FILTER:', eligibleForDeletion)
  return (
    ecs
      .listTaskDefinitions({ status: 'ACTIVE' })
      .promise()
      // .tap(() => Promise.delay(config.API_DELAY))
      .then(getAllImagesTagsByTaskDef(ecs))
      .then(activeImages => {
        const activeImagesFlatten = R.compose(R.uniq, R.flatten)(activeImages)
        console.log('ACTIVE IMAGES:', activeImagesFlatten)

        // Remove images from deletion that are active
        return R.difference(activeImagesFlatten, eligibleForDeletion)
      })
  )
}

/**
 * Fetch all layers / image details from the repo
 * Filter out everything newer than some variable amount of days
 * set via REPO_AGE_THRESHOLD (90 days by default)
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @param {AWS.ECR.ImageIdentifierList} images Array of images to be filtered by date
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const filterImagesByDateThreshold = (config, ecr, images) => {
  console.info('IMAGES TO PROCESS (filterImagesByDateThreshold):', images)

  // No REPO_AGE_THRESHOLD so no images to filter
  if (!config.REPO_AGE_THRESHOLD) {
    return []
  }

  const params = {
    imageIds: images,
    repositoryName: config.REPO_TO_CLEAN
  }

  return ecr
    .describeImages(params)
    .promise()
    .then(R.propOr([], 'imageDetails'))
    .then(imageDetails =>
      // Get all tags eligible for deletion by age threshold
      // coerce each of the tags to a full image reference for easy comparison
      imageDetails
        .map(image => {
          const created = image.imagePushedAt
          const imageTag = R.propOr('', 0, image.imageTags)
          if (created && imageTag !== 'latest' && getImageAgeDays(created) >= config.REPO_AGE_THRESHOLD) {
            return createRepoUrl(config, imageTag)
          }
          return null
        })
        .filter(R.identity)
    )
}

/**
 * Fetch all layers / image details from the repo
 * Filter out everything but the first n images
 * set via REPO_FIRST_N_THRESHOLD (3 by default)
 *
 * @param {Config} config Global config object
 * @param {AWS.ECR} ecr ECR API
 * @param {AWS.ECR.ImageIdentifierList} images Array of images to be filtered by n
 * @returns {Promise<AWS.ECR.ImageIdentifierList>}
 */
const filterImagesByFirstN = (config, ecr, images) => {
  console.info('IMAGES TO PROCESS (filterImagesByFirstN):', images)

  // No REPO_FIRST_N_THRESHOLD so no images to filter
  if (!config.REPO_FIRST_N_THRESHOLD) {
    return []
  }

  const sortByCreated = R.sortBy(R.prop('created'))
  const groupByEnv = R.groupBy(image => {
    const tag = image.imageTag
    const tagEnv = config.ENVS.find(env => R.contains(env, tag))
    return tagEnv || tag
  })

  const params = {
    imageIds: images,
    repositoryName: config.REPO_TO_CLEAN
  }

  return ecr
    .describeImages(params)
    .promise()
    .then(R.propOr([], 'imageDetails'))
    .then(imageDetails => {
      // Get all tags eligible for deletion by age threshold
      // coerce each of the tags to a full image reference for easy comparison
      const imagesAndDays = imageDetails
        .map(image => {
          const created = image.imagePushedAt
          const imageTag = R.propOr('', 0, image.imageTags)

          return {
            created: created || -Infinity,
            imageTag
          }
        })
        .filter(R.identity)

      return R.compose(
        R.map(createRepoUrl(config)),
        R.map(R.prop('imageTag')),
        R.unnest,
        R.values,
        R.map(R.takeLast(config.REPO_FIRST_N_THRESHOLD)),
        groupByEnv,
        sortByCreated
      )(imagesAndDays)
    })
}

module.exports = {
  getRepoImages: R.curry(getRepoImages),
  deleteImages: R.curry(deleteImages),
  filterOutActiveImages: R.curry(filterOutActiveImages),
  filterImagesByDateThreshold: R.curry(filterImagesByDateThreshold),
  filterImagesByFirstN: R.curry(filterImagesByFirstN)
}
