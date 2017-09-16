const debug = require('debug')('aws-lambda-ecr-cleaner:configBuilder')

/**
 * 
 * 
 * @param {Object} config 
 * @param {Object} context 
 * @returns {Config}
 */
const configBuilder = (configJson, context) => {
  const AWS_ACCOUNT_ID = context.invoked_function_arn.split(':')[4]

  const config = Object.assign({}, configJson, process.env, {
    AWS_ACCOUNT_ID
  })
  if (!configJson.REPO_TO_CLEAN) {
    debug('ERROR: NO REPO_TO_CLEAN, must be set')
    throw new Error('Must set REPO_TO_CLEAN')
  }
  return config
}

module.exports = configBuilder
