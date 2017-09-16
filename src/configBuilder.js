/**
  @typedef Config
  @type {object}
  @property {string} DRY_RUN - Run without delete.
  @property {number} API_DELAY - Delay between calls.
  @property {number} REPO_AGE_THRESHOLD - Image age threshold.
  @property {number} REPO_FIRST_N_THRESHOLD - How many images from each group to keep.
  @property {number} AWS_ACCOUNT_ID - The account id number.
  @property {string} REGION - ECR and ECS region..
  @property {string|string[]} REPO_TO_CLEAN - One repo name or an array of repos name to clean.
  @property {string|string[]} ENVS - Group by these strings and one for each unique tag.
 **/

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
    console.error('ERROR: NO REPO_TO_CLEAN, must be set')
    throw new Error('Must set REPO_TO_CLEAN')
  }
  return config
}

module.exports = configBuilder
