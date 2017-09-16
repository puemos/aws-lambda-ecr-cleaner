const withNextToken = (callFn, initParams, resultPropName) => (prevResult, nextToken) => {
  const params = Object.assign({}, initParams, {
    nextToken
  })
  return callFn(params)
    .promise()
    .then(res => {
      const nextResult = [].concat(prevResult).concat(res.nextResult[resultPropName])
      return res.nextToken ? callFn(nextResult, res.nextToken) : nextResult
    })
}
