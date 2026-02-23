import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromContainerMetadata, fromInstanceMetadata } from "@aws-sdk/credential-providers";

const region = process.env.AWS_REGION ?? "us-east-1";

// Try container metadata (ECS/Lambda), then instance metadata (EC2)
const client = new DynamoDBClient({
  region,
  credentials: fromContainerMetadata({ timeout: 5000, maxRetries: 3 }),
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = "hotel-facilities";
