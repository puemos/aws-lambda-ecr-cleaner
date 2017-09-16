const imageIds = require('./imageIds.json')
const imageDetails = require('./imageDetails.json')

const mock = AWSMock => {
  AWSMock.mock('ECR', 'listImages', (params, callback) => {
    callback(null, imageIds[params.nextToken === undefined ? 0 : params.nextToken])
  })
  AWSMock.mock('ECR', 'describeImages', (params, callback) => {
    callback(null, imageDetails[params.nextToken === undefined ? 0 : params.nextToken])
  })
  AWSMock.mock('ECR', 'batchDeleteImage', (params, callback) => {
    callback(null, {
      failures: [],
      imageIds: [
        {
          imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
          imageTag: 'prod-precise-1'
        },
        {
          imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
          imageTag: 'prod-precise-2'
        },
        {
          imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
          imageTag: 'prod-precise-3'
        },
        {
          imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
          imageTag: 'latest'
        }
      ]
    })
  })
}

module.exports = mock
