# Platform SDK

Functional SDK for the Serverless Platfrom.

## Project Status

[![Build Status](https://travis-ci.com/serverless/platform-sdk.svg)](https://travis-ci.com/serverless/platform-sdk)
[![license](https://img.shields.io/npm/l/@serverless/platform-sdk.svg)](https://www.npmjs.com/package/@serverless/platform-sdk)
[![coverage](https://img.shields.io/codecov/c/github/serverless/platform-sdk.svg)](https://codecov.io/gh/serverless/platform-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/serverless/platform-sdk/badge.svg)](https://snyk.io/test/github/serverless/platform-sdk)

## Contents

- [Installation](#installation)
- [Functions](#functions)
  - [login](#login)
  - [refreshToken](#refreshtoken)
  - [createAccessKey](#createaccesskey)
  - [archiveService](#archiveservice)
  - [getServiceUrl](#getserviceurl)
  - [listTenants](#listtenants)
  - [createDeployment](#createdeployment)
  - [updateDeployment](#updatedeployment)
  - [getApp](#getapp)
  - [createApp](#createapp)

## installation

```
npm i -s @serverless/platform-sdk
```

## Functions
### `login`
Opens a browser for the user to login, along with a running server awaiting auth data once the user logs in.

**Parameters**

None

**Returns**

Promise resolving to the following object:

- `username` - `string` - dashboard username
- `accessToken` - `string` - Auth0 access token
- `idToken` - `string` - Auth0 idToken
- `refreshToken` - `string` - Auth0 refreshToken
- `expiresAt` - `string` - epoch time at which the idToken expires

**Example**

```js
const { login } = require('@serverless/platform-sdk')

const { username, accessToken, idToken, expiresAt } = await login()
```

---

### `refreshToken`
Refreshes Auth0 idToken

**Parameters**

refresh token string

**Returns**


Promise resolving to the following object:

- `id_token` - `string` - new Auth0 id token
- `access_token` - `string` - new Auth0 access token
- `expires_in` - `string` - number of seconds until token expiration

**Example**

```js
const { refreshToken } = require('@serverless/platform-sdk')

const { id_token, access_token, expires_in } = await refreshToken('some-refresh-token')
```

---

### `createAccessKey`
Creates a platform access key for the authenticated user.

**Parameters**

Object

- `username` - `string` - dashboard username
- `tenant` - `string` - dashboard tenant
- `idToken` - `string` - Auth0 idToken
- `title` - `string` - title of the access key

**Returns**

Promise resolving to an `accessKey` string, that is the access key.

**Example**

```js
const { createAccessKey } = require('@serverless/platform-sdk')

const data = {
  username: 'eahefnawy',
  tenant: 'eahefnawy',
  idToken: 'abc',
  title: 'Framework'
}

const accessKey = await createAccessKey(data)
```

---

### `archiveService`
Archives a service in the platform.

**Parameters**

Object

- `tenant` - `string` - dashboard tenant
- `accessKey` - `string` - dashboard access key
- `app` - `string` - service app
- `name` - `string` - service name
- `provider` - `string` - provider name
- `region` - `string` - region name

**Returns**

None

**Example**

```js
const { archiveService } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  accessKey: 'abc',
  app: 'my-app',
  name: 'my-service',
  provider: 'aws',
  region: 'us-east-1'
}

await archiveService(data)
```

---

### `getServiceUrl`
Constructs a service url based on passed-in data.

**Parameters**

Object

- `tenant` - `string` - dashboard tenant
- `app` - `string` - service app
- `name` - `string` - service name


**Returns**

The service url string.

**Example**

```js
const { getServiceUrl } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  app: 'my-app',
  name: 'my-service'
}

const serviceUrl = getServiceUrl(data)
```

---

### `listTenants`
Lists the tenants for a given username

**Parameters**

Object

- `username` - `string` - dashboard username
- `idToken` - `string` - auth0 user id token


**Returns**

Array of objects, each represents a single tenant data model.

**Example**

```js
const { listTenants } = require('@serverless/platform-sdk')

const data = {
  username: 'eahefnawy',
  idToken: 'abc'
}

const tenants = await listTenants(data)
```

---

### `createDeploymnet`
Creates a platform deployment

**Parameters**

Object

- `tenant` - `string` - dashboard tenant name
- `app` - `string` - app name
- `serviceName` - `string` - service name
- `accessKey` - `string` - dashboard access key
- `files` - `object` - files which should be stored in the Platforms deployment record

**Returns**

Object - Deployment model

**Example**

```js
const { createDeployment } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  app: 'my-app',
  serviceName: 'my-service',
  accessKey: 'abc',
  files: {
    'serverless-state.json': {
      //...snip...
    }
  }
}

const { id } = await createDeployment(data)
```

---

### `updateDeployment`
Updates a platform deployment

**Parameters**

Object

- `tenant` - `string` - dashboard tenant name
- `app` - `string` - app name
- `serviceName` - `string` - service name
- `deploymentId` - `string` - id of the previously created deployment
- `status` - `string` - status of the deployment to update
- `accessKey` - `string` - dashboard access key
- `computedData` - `object` - computed data the Platform needs to generate the state items


**Returns**

Object - Deployment model

**Example**

```js
const { updateDeployment } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  app: 'my-app',
  serviceName: 'my-service',
  deploymentId: 'abc',
  status: 'failed',
  accessKey: 'abc',
  computedData: {
    // ...snip...
  }
}

const { id } = await updateDeployment(data)
```

---

### `getApp`
Gets a platform app

**Parameters**

Object

- `tenant` - `string` - dashboard tenant name
- `app` - `string` - app name
- `token` - `string` - Auth0 id token


**Returns**

Object - App model

**Example**

```js
const { getApp } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  app: 'my-app',
  token: 'abc'
}

const app = await getApp(data)
```

---

### `createApp`
Creates a platform app

**Parameters**

Object

- `tenant` - `string` - dashboard tenant name
- `app` - `string` - app name
- `token` - `string` - Auth0 id token


**Returns**

Object - App model

**Example**

```js
const { createApp } = require('@serverless/platform-sdk')

const data = {
  tenant: 'eahefnawy',
  app: 'my-app',
  token: 'abc'
}

const app = await createApp(data)
```
