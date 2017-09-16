'use strict'
require('supports-color')
const test = require('ava')
const AWSMock = require('aws-sdk-mock')
const mockECR = require('./Mocks/ECR')
const mockECS = require('./Mocks/ECS')

const AWS = require('aws-sdk')
const Promise = require('bluebird')

const Api = require('../src/api')

const config = {
  AWS_ACCOUNT_ID: 123,
  REGION: 'no-where',
  REPO_TO_CLEAN: 'hack'
}

test.before(async t => {
  mockECR(AWSMock)
  mockECS(AWSMock)
})

test.after(async t => {
  AWSMock.restore('ECR')
  AWSMock.restore('ECS')
})

test('Api.getRepoImages', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.getRepoImages(config, ecr)
  t.deepEqual(imagesList, [
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
  ])
})

test('Api.filterImagesByFirstN - no REPO_FIRST_N_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByFirstN(config, ecr, [
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
  ])
  t.deepEqual(imagesList, [])
})

test('Api.filterImagesByFirstN - with REPO_FIRST_N_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByFirstN(
    Object.assign({}, config, { REPO_FIRST_N_THRESHOLD: 1, ENVS: ['dev', 'prod'] }),
    ecr,
    [
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

  const imagesList = await Api.filterImagesByDateThreshold(config, ecr, [
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
  ])
  t.deepEqual(imagesList, [])
})

test('Api.filterImagesByFirstN - with REPO_AGE_THRESHOLD', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterImagesByDateThreshold(
    Object.assign({}, config, { REPO_AGE_THRESHOLD: 1, ENVS: ['dev', 'prod'] }),
    ecr,
    [
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

test('Api.filterOutActiveImages', async t => {
  const ecr = new AWS.ECR()
  const ecs = new AWS.ECS()
  AWS.config.setPromisesDependency(Promise)

  const imagesList = await Api.filterOutActiveImages(config, ecr, ecs, [
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-1',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-3',
    '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-1',
    '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-2'
  ])
  t.deepEqual(
    imagesList.sort(),
    [
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
      '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-3',
      '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-1',
      '123.dkr.ecr.no-where.amazonaws.com/hack:dev-precise-2'
    ].sort()
  )
})
test('Api.deleteImages', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const res = await Api.deleteImages(config, ecr, [
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-1',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-3',
    '123.dkr.ecr.no-where.amazonaws.com/hack:latest'
  ])
  t.deepEqual(res, {
    failures: [],
    success: [
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
    ],
    count: 4
  })
})
test('Api.deleteImages', async t => {
  const ecr = new AWS.ECR()
  AWS.config.setPromisesDependency(Promise)

  const res = await Api.deleteImages(Object.assign({}, config, { DRY_RUN: true }), ecr, [
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-1',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-2',
    '123.dkr.ecr.no-where.amazonaws.com/hack:prod-precise-3',
    '123.dkr.ecr.no-where.amazonaws.com/hack:latest'
  ])
  t.deepEqual(res, {
    failures: [],
    success: [],
    count: 0
  })
})
