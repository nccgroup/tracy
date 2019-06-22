"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var index_1 = __importDefault(require("./index"));
describe("creating a new SNS event", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:sns", {
            Records: [
                {
                    Sns: {
                        Message: "trigger-email",
                    },
                },
            ],
        });
        chai_1.expect(event.Records[0].Sns.Message).to.equal("trigger-email");
        chai_1.expect(event.Records[0].Sns.Type).to.equal("Notification");
    });
});
describe("createSqsEvent()", function () {
    it("should return SQS mocked event", function () {
        var event = index_1.default("aws:sqs", {
            Records: [
                {
                    body: JSON.stringify({
                        foo: "bar",
                    }),
                },
            ],
        });
        chai_1.expect(event.Records[0].body).to.equal("{\"foo\":\"bar\"}");
        chai_1.expect(event.Records[0].eventSource).to.equal("aws:sqs");
    });
});
describe("createApigEvent()", function () {
    it("should return APIG mocked event", function () {
        var event = index_1.default("aws:apiGateway", {
            body: JSON.stringify({
                first_name: "Sam",
                last_name: "Smith",
            }),
        });
        var parsedBody = JSON.parse(event.body || "");
        chai_1.expect(parsedBody.first_name).to.equal("Sam");
        chai_1.expect(parsedBody.last_name).to.equal("Smith");
        chai_1.expect(event.httpMethod).to.equal("GET");
    });
});
describe("createWebsocketEvent()", function () {
    it("should return websocket mocked event", function () {
        var event = index_1.default("aws:websocket", {
            body: JSON.stringify({
                first_name: "Sam",
                last_name: "Smith",
            }),
            requestContext: {
                connectedAt: 123,
                connectionId: "abc123",
            },
        });
        var parsedBody = JSON.parse(event.body || "");
        chai_1.expect(parsedBody.first_name).to.equal("Sam");
        chai_1.expect(parsedBody.last_name).to.equal("Smith");
        chai_1.expect(event.requestContext.connectedAt).to.equal(123);
        chai_1.expect(event.requestContext.connectionId).to.equal("abc123");
    });
});
describe("createS3Event()", function () {
    it("should return S3 mocked event", function () {
        var event = index_1.default("aws:s3", {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: "my-bucket-name",
                        },
                        object: {
                            key: "object-key",
                        },
                    },
                },
            ],
        });
        chai_1.expect(event.Records[0].s3.bucket.name).to.equal("my-bucket-name");
        chai_1.expect(event.Records[0].s3.object.key).to.equal("object-key");
        chai_1.expect(event.Records[0].eventName).to.equal("ObjectCreated:Put");
    });
    it("should return S3 mocked event without side-effect", function () {
        var event = index_1.default("aws:s3", {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: "my-bucket-name",
                        },
                        object: {
                            key: "object-key",
                        },
                    },
                },
            ],
        });
        var event2 = index_1.default("aws:s3", {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: "my-bucket-name",
                        },
                        object: {
                            key: "object-key-2",
                        },
                    },
                },
            ],
        });
        chai_1.expect(event.Records[0].s3.bucket.name).to.equal("my-bucket-name");
        chai_1.expect(event.Records[0].s3.object.key).to.equal("object-key");
        chai_1.expect(event2.Records[0].s3.object.key).to.equal("object-key-2");
        chai_1.expect(event.Records[0].eventName).to.equal("ObjectCreated:Put");
    });
});
describe("createScheduledEvent()", function () {
    it("should return Scheduled mocked event", function () {
        var event = index_1.default("aws:scheduled", {
            region: "us-west-2",
        });
        chai_1.expect(event.region).to.equal("us-west-2");
        chai_1.expect(event["detail-type"]).to.equal("Scheduled Event");
    });
});
describe("createKinesisEvent()", function () {
    it("should return Kinesis mocked event", function () {
        var event = index_1.default("aws:kinesis", {
            Records: [
                {
                    kinesis: {
                        data: Buffer.from("kinesis test").toString("base64"),
                    },
                },
            ],
        });
        chai_1.expect(Buffer.from(event.Records[0].kinesis.data, "base64").toString("ascii")).to.equal("kinesis test");
    });
});
describe("createCloudWatchEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:cloudWatch", {
            "detail-type": "Something has been deleted.",
            "region": "us-east-1",
        });
        chai_1.expect(event["detail-type"]).to.equal("Something has been deleted.");
        chai_1.expect(event.region).to.equal("us-east-1");
    });
});
describe("createCloudWatchLogEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:cloudWatchLog", {
            awslogs: {
                data: "Some gzipped, then base64 encoded data",
            },
        });
        chai_1.expect(event.awslogs.data).to.equal("Some gzipped, then base64 encoded data");
    });
});
describe("createAlexaSkillEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:alexaSkill", {
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
        });
        chai_1.expect(event.request.type).to.equal("CanFulfillIntentRequest");
        chai_1.expect(event.context.System.device.deviceId).to.equal("myDevice");
    });
});
describe("createAlexaSmartHomeEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:alexaSmartHome", {
            payload: {
                switchControlAction: "TURN_OFF",
            },
        });
        chai_1.expect(event.payload.switchControlAction).to.equal("TURN_OFF");
    });
});
describe("createIotEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:iot", {
            this: {
                can: {
                    be: "anything I want",
                },
            },
        });
        chai_1.expect(event.this.can.be).to.equal("anything I want");
    });
});
describe("createCognitoPoolEvent()", function () {
    it("should return a valid event", function () {
        var event = index_1.default("aws:cognitoUserPool", {
            userName: "notAJ",
        });
        chai_1.expect(event.userName).to.eql("notAJ");
    });
});
//# sourceMappingURL=index.spec.js.map