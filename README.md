## aws-lambda-ecr-cleaner

An AWS Lambda Function to clean ecr repos automatically. 

### Requirements

- `node.js` ( AWS Lambda working version is **4.3.2** )
- `make`

### Installation

Clone this repository and install dependencies:

```bash
$ git clone git@github.com:Puemos/aws-lambda-ecr-cleaner.git
$ cd aws-lambda-ecr-cleaner
$ npm install .
```

### Packaging

AWS Lambda accepts zip archived package. To create it, run `make lambda` task simply.

```bash
$ make lambda
```

It will create `aws-lambda-ecr-cleaner.zip` at project root. You can upload it.

### Configuration

	1. Create config folder and inside index.js file
```bash
$ mkdir config
$ touch index.js
```
	2.	edit index.js

```javascript
exports.REGION = <String>
exports.DRY_RUN = <Boll>
exports.REPO_TO_CLEAN = <String> || <Array<String>>
exports.REPO_AGE_THRESHOLD = <Int>
exports.REPO_FIRST_N_THRESHOLD = <Int>
exports.AWS_ACCOUNT_ID = <Int>
```

- `REGION`: ECR and ECS region.
- `DRY_RUN`: Run without delete
- `REPO_TO_CLEAN`: One repo name or an array of repos name to clean
- `REPO_FIRST_N_THRESHOLD`: How many images from each environment to keep
- `AWS_ACCOUNT_ID`: The account id number

### License

MIT License.

### Author

Shy Alter

### Credits

- https://github.com/ysugimoto/aws-lambda-image
- https://github.com/trek10inc/ecr-cleaner
