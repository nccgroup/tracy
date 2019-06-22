module.exports = function capacityPolicy(policy, service, options) {
  const limits = {
    readCapacityMax: 1,
    writeCapacityMax: 1,
    ...options
  }

  const template = service.compiled['cloudformation-template-update-stack.json']
  if (template.Resources) {
    Object.entries(template.Resources).forEach(([name, resource]) => {
      if (resource.Type === 'AWS::DynamoDB::Table') {
        if (resource.Properties.ProvisionedThroughput.ReadCapacityUnits > limits.readCapacityMax) {
          throw new policy.Failure(
            `Table "${name}" has excess read capacity. Lower the value of ReadCapacityUnits to at most ${
              limits.readCapacityMax
            }.`
          )
        }

        if (
          resource.Properties.ProvisionedThroughput.WriteCapacityUnits > limits.writeCapacityMax
        ) {
          throw new policy.Failure(
            `Table "${name}" has excess write capacity. Lower the value of WriteCapacityUnits to at most ${
              limits.writeCapacityMax
            }.`
          )
        }
      }
    })
  }

  policy.approve()
}
