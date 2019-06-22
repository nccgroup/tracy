# Development Notes
## Using the latest version from `master`
You can install the latest version from the master branch by installing the `next` tag:	
```	
npm install @serverless/enterprise-plugin@next	
```	
Note, the `next` published version of `@serverless/enterprise-plugin` depends on the
`next` version of `@serverless/platform-sdk` not what is in the `package.json` (it is
modified by the Travis CI build before publishing to npm)

## working with a local dev version of the plugin
install the plugin via path in your serverless service
```
npm i $PATH_TO_PLUGIN
```

### note about `@serverless/platform-sdk`
The `package.json` of this file refers to the current stable build of `platform-sdk`.
If you need the current dev version from `master`, change the verison to `next`.
If you need to make your own changes to it, `npm i $PATH_TO_SDK`.

## `serverless-sdk`
Currently, the `serverless-sdk` is within this project.  On deployment, this plugin copies a	
bundled and compressed version of the `serverless-sdk` into your Service package before it's	
uploaded. 
