mkdir secrets-example-service
curl https://raw.githubusercontent.com/serverless/enterprise-plugin/master/examples/secrets-example-service/package.json --output secrets-example-service/package.json
curl https://raw.githubusercontent.com/serverless/enterprise-plugin/master/examples/secrets-example-service/serverless.yml --output secrets-example-service/serverless.yml
curl https://raw.githubusercontent.com/serverless/enterprise-plugin/master/examples/secrets-example-service/handler.js --output secrets-example-service/handler.js
npm install --prefix secrets-example-service
