# Event Mocks
A small library that includes details mocks of AWS Lambda event sources. Useful for use when unit testing your Lambda functions.
Supported Event Sources are:
- [x] API Gateway
- [x] SNS
- [x] SQS
- [x] DynamoDB
- [x] S3
- [x] Scheduled
- [x] Websocket
- [x] Alexa Skill
- [x] Alexa Smart Home
- [x] CloudWatch
- [x] CloudWatch Log
- [x] Cognito Pool
- [x] IoT

The library simply uses default event source mock templates and merge it with any overwrite you provide. [Check out the JSON template files](./lib/events/aws) to learn more about the data structure of each event source.

## Usage

### SNS

```js
import createEvent from "@serverless/event-mocks"

const mocked = createEvent(
  "aws:sns",
  {
    Records: [{
      Sns: {
        Message: "trigger-email"
      }
    }]
  });
```

### API Gateway

```js
import createEvent from "@serverless/event-mocks"

const event = createEvent(
  "aws:apiGateway",
  {
    body: {
      first_name: "Sam",
      last_name: "Smith"
    }
  });
```

### S3

```js
import createEvent from "@serverless/event-mocks"

const event = createEvent(
  "aws:s3",
  {
    Records: [{
      eventName: "ObjectCreated:Put",
      s3: {
        bucket: {
          name: "my-bucket-name"
        },
        object: {
          key: "object-key"
        }
      }
    }]
  });
```

### Scheduled

```js
import createEvent from "@serverless/event-mocks"

const event = createEvent(
  "aws:scheduled",
  {
    region: "us-west-2"
  });
```

### Kinesis

```js
import createEvent from "@serverless/event-mocks"

const event = createEvent(
  "aws:kinesis",
  {
    data: new Buffer("this is test data").toString("base64")
  });
```

### Dynamo

```js
import createEvent from "@serverless/event-mocks"

const event = createEvent(
  "aws:dynamo",
  {
    Records: [
      {
      eventID: "1",
      eventVersion: "1.0",
      dynamodb: {
        Keys: {
          Id: {
            N: "101"
          }
        },
        NewImage: {
          Message: {
            S: "New item!"
          },
          Id: {
            N: "101"
          }
        },
        StreamViewType: "NEW_AND_OLD_IMAGES",
        SequenceNumber: "111",
        SizeBytes: 26
      },
      awsRegion: "us-west-2",
      eventName: "INSERT",
      eventSourceARN: "arn:aws:dynamodb:us-east-1:123456789012:table/images",
      eventSource: "aws:dynamodb"
      }
    ]
  });
```

### Websocket event

```js
  const event = createEvent("aws:websocket", {
    body: {
      first_name: "Sam",
      last_name: "Smith",
    },
    requestContext: {
      connectedAt: 123,
      connectionId: "abc123",
    },
  });
```
### CloudWatch event

```js
  const event = createEvent("aws:cloudWatch", {
    "detail-type": "Something has been deleted.",
    "region": "us-east-1"
  });
```

### CloudWatchLog event

```js
  const event = createEvent("aws:cloudWatchLog", {
    awslogs: {
      data: "Some gzipped, then base64 encoded data",
    }
  });
```

### Alexa Skill event

```js
  const event = createEvent("aws:alexaSkill", {
    request: {
      type: "CanFulfillIntentRequest",
    },
    context: {
      System: {
        device: {
          deviceId: "myDevice",
        },
      },
    },
  }
```

### Alexa SmartHome event
```js
  const event = createEvent("aws:alexaSmartHome", {
    payload: {
      switchControlAction: "TURN_OFF",
    },
  }
```

### IoT event
```js
  const event = createEvent("aws:iot", {
    this: {
      can: {
        be: "anything I want",
      },
    }
```

### Cognito Pool Event
```js
  const event = createEvent("aws:cognitoUserPool", {
    userName: "Aaron Stuyvenberg",
  }
```
