module.exports.callback = (evt, ctx, cb) => {
  return cb(null, 'success')
}

module.exports.callbackError = (evt, ctx, cb) => {
  return cb('error', null)
}

module.exports.contextDone = (evt, ctx, cb) => {
  return ctx.done(null, 'success')
}

module.exports.contextSucceed = (evt, ctx, cb) => {
  return ctx.succeed('success')
}

module.exports.contextFail = (evt, ctx, cb) => {
  return ctx.fail('error')
}

module.exports.promise = (evt) => {
  return new Promise((resolve, reject) => {
    resolve('success')
  })
}

module.exports.promiseError = (evt) => {
  return new Promise((resolve, reject) => {
    throw new Error('This is an error')
  })
}

module.exports.async = async (evt) => {
  return new Promise((resolve, reject) => {
    resolve('success')
  })
}

module.exports.asyncError = async (evt) => {
  return new Promise((resolve, reject) => {
    throw new Error('This is an error')
  })
}
