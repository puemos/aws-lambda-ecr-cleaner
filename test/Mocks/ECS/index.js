const taskDefinitions = require('./taskDefinitions.json')

const mock = AWSMock => {
  AWSMock.mock('ECS', 'describeTaskDefinition', (params, callback) => {
    callback(null, taskDefinitions[0])
  })
  AWSMock.mock('ECS', 'listTaskDefinitions', (params, callback) => {
    callback(null, {
      taskDefinitionArns: [
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/sleep300:2',
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/sleep360:1',
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/wordpress:3',
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/wordpress:4',
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/wordpress:5',
        'arn:aws:ecs:us-east-1:<aws_account_id>:task-definition/wordpress:6'
      ],
      nextToken: null
    })
  })
}

module.exports = mock
