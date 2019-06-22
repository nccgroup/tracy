import { APIGatewayEvent, ScheduledEvent, S3Event, KinesisStreamEvent, DynamoDBStreamEvent, SQSEvent, SNSEvent } from 'aws-lambda';
export declare type GeneratedEvent = APIGatewayEvent | ScheduledEvent | S3Event | KinesisStreamEvent | DynamoDBStreamEvent | SQSEvent | SNSEvent;
