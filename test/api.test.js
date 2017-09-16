'use strict'

const test = require('ava')
const AWSMock = require('aws-sdk-mock')
const mockECR = require('./Mocks/ECR')

const AWS = require('aws-sdk')
const Promise = require('bluebird')

const Api = require('../src/api')

const testImgIds = [
  {
    imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
    imageTag: '2016.09'
  },
  {
    imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
    imageTag: '2017.05'
  },
  {
    imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
    imageTag: '2017.09'
  },
  {
    imageDigest: 'sha256:f1d4ae3f7261a72e98c6ebefe9985cf10a0ea5bd762585a43e0700ed99863807',
    imageTag: 'latest'
  }
]

const config = {
  AWS_ACCOUNT_ID: 123,
  REGION: 'no-where',
  REPO_TO_CLEAN: 'hack'
}

test.before(async t => {
  mockECR(AWSMock)
})

test.after(async t => {
  AWSMock.restore('ECR')
})

test('Api.getRepoImages', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.getRepoImages(config, ecr)
  t.deepEqual(imagesList, testImgIds)
})

test('Api.filterImagesByFirstN - no REPO_FIRST_N_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByFirstN(config, ecr, testImgIds)
  t.deepEqual(imagesList, [])
})

test('Api.filterImagesByFirstN - with REPO_FIRST_N_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByFirstN(
    Object.assign({}, config, { REPO_FIRST_N_THRESHOLD: 1, ENVS: ['dev', 'prod'] }),
    ecr,
    testImgIds
  )
  t.deepEqual(
    imagesList.sort(),
    [
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-1',
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
      '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-1'
    ].sort()
  )
})

test('Api.filterImagesByFirstN - no REPO_AGE_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByDateThreshold(config, ecr, testImgIds)
  t.deepEqual(imagesList, [])
})

test('Api.filterImagesByFirstN - with REPO_AGE_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByDateThreshold(
    Object.assign({}, config, { REPO_AGE_THRESHOLD: 1, ENVS: ['dev', 'prod'] }),
    ecr,
    testImgIds
  )
  console.log(imagesList.sort())
  t.deepEqual(
    imagesList.sort(),
    [
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-1',
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
      '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-1'
    ].sort()
  )
})
