module.exports = function tableNamePolicy(policy, service) {
  const stage = service.compiled['serverless-state.json'].service.provider.stage

  const template = service.compiled['cloudformation-template-update-stack.json']
  if (template.Resources) {
    Object.entries(template.Resources).forEach(([name, resource]) => {
      if (resource.Type === 'AWS::DynamoDB::Table') {
        if (!resource.Properties.TableName.endsWith(`-${stage}`)) {
          throw new policy.Failure(
            `Expected TableName property of "${name}" to end with "-${stage}" to reflect the current stage. Instead found "${
              resource.Properties.TableName
            }".`
          )
        }
      }
    })
  }

  policy.approve()
}
