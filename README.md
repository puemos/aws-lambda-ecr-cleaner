# aws-lambda-ecr-cleaner

[![Code Climate](https://codeclimate.com/github/puemos/aws-lambda-ecr-cleaner/badges/gpa.svg)](https://codeclimate.com/github/puemos/aws-lambda-ecr-cleaner)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Coverage Status](https://coveralls.io/repos/github/puemos/aws-lambda-ecr-cleaner/badge.svg?branch=master)](https://coveralls.io/github/puemos/aws-lambda-ecr-cleaner?branch=master)
[![Build](https://travis-ci.org/puemos/aws-lambda-ecr-cleaner.svg?branch=master)](https://travis-ci.org/puemos/aws-lambda-ecr-cleaner#master)



An AWS Lambda Function to clean ecr repos automatically. 

## Requirements

- `node.js` ( AWS Lambda working version is **4.3.2** )

## Installation

Clone this repository and install dependencies:

```bash
$ git clone git@github.com:Puemos/aws-lambda-ecr-cleaner.git
$ cd aws-lambda-ecr-cleaner
$ npm install
```

## Packaging

AWS Lambda accepts zip archived package. To create it, run `npm run package ` task simply.

```bash
$ npm run package --packageDirectory=./dist
```

It will create `aws-lambda-ecr-cleaner.zip` at project root. You can upload it.

## Configuration

### Hardcode the configuration on config.json


### Use AWS [Environment Variables](http://docs.aws.amazon.com/lambda/latest/dg/env_variables.html)


| Name                   | Type                  | Description                                        | Default   |
|------------------------|-----------------------|----------------------------------------------------|-----------|
| DRY_RUN                | Bool                  | Run without delete                                 | true      |
| API_DELAY              | Integer               | Delay between calls                                | 500       |
| REPO_AGE_THRESHOLD     | Integer               | Image age threshold                                | 90        |
| REPO_FIRST_N_THRESHOLD | Integer               | How many images from each group to keep            | 3         |
| AWS_ACCOUNT_ID         | Integer               | The account id number                              |           |
| REGION                 | String                | ECR and ECS region.                                | us-east-1 |
| REPO_TO_CLEAN          | String / Array String | One repo name or an array of repos name to clean   |           |
| ENVS                   | Array String          | Group by these strings and one for each unique tag |           |

## License

MIT License @ [Shy Alter](https://github.com/puemos/)


## Credits

- https://github.com/ysugimoto/aws-lambda-image
- https://github.com/trek10inc/ecr-cleaner
