module.exports = function corsPolicy(policy, service) {
  const functions = service.compiled['serverless-state.json'].service.functions

  if (!functions) {
    return policy.approve()
  }

  Object.entries(functions).forEach(([functionName, functionConfig]) => {
    if (!functionConfig.events) return

    functionConfig.events.forEach((eventConfig) => {
      if (!eventConfig.http) return
      if (!eventConfig.http.cors) {
        policy.warn(
          `Function "${functionName}" has no CORS configuration for its HTTP subscription.`
        )
        return
      }

      if (
        eventConfig.http.cors.origin === '*' ||
        (eventConfig.http.cors.origins && eventConfig.http.cors.origins.includes('*'))
      ) {
        throw new policy.Failure(
          `Function "${functionName}" uses a wildcard CORS origin for an HTTP subscription. All CORS configurations must have specific, non-wildcard origins.`
        )
      }
    })
  })

  policy.approve()
}
