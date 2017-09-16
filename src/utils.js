const R = require('ramda')

/**
 * helper function for calles with next token
 * 
 * @param {Function} callFn 
 * @param {Object} initParams 
 * @param {string} resultPropName 
 * @return {function}
 */
const withNextToken = R.curry((callFn, resultPropName, initParams) => {
  /**
     * @param {any[]} prevResult 
     * @param {string} nextToken 
     * @returns {Promise<any[]>}
     */
  return function recutionFn (prevResult, nextToken) {
    const params = Object.assign({}, initParams, {
      nextToken
    })
    return callFn(params)
      .promise()
      .then(res => {
        const nextResult = [].concat(prevResult || []).concat(res[resultPropName])
        return res.nextToken !== null ? recutionFn(nextResult, res.nextToken) : nextResult
      })
  }
})

const addTag = tag => (R.isEmpty(tag) ? '' : ':' + tag)

/**
   *  Create a repo Url by the config and imageTag
   *
   * @param {Config} config Global config object
   * @param {AWS.ECR} ecr ECR API
   * @returns {AWS.ECR.Url}
   */
const createRepoUrl = R.curry(
  (config, imageTag) =>
    `${config.AWS_ACCOUNT_ID}.dkr.ecr.${config.REGION}.amazonaws.com/${config.REPO_TO_CLEAN}${addTag(
      imageTag
    )}`
)

/**
   * Convert ts to days
   *
   * @param {Date} date
   * @returns {number} number of days
   */
const getImageAgeDays = date => {
  const deltaMS = Date.now() - date * 1000
  const days = 1000 * 60 * 60 * 24
  return Math.round(deltaMS / days)
}

module.exports = {
  getImageAgeDays,
  createRepoUrl,
  withNextToken
}
