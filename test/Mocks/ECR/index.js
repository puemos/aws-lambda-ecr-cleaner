const imageIds = require('./imageIds.json')
const imageDetails = require('./imageDetails.json')

const mock = AWSMock => {
  AWSMock.mock('ECR', 'listImages', (params, callback) => {
    callback(null, imageIds[params.nextToken === undefined ? 0 : params.nextToken])
  })
  AWSMock.mock('ECR', 'describeImages', (params, callback) => {
    callback(null, imageDetails[params.nextToken === undefined ? 0 : params.nextToken])
  })
}

module.exports = mock
