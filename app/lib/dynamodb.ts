import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Log ALL env var keys (not values) to diagnose what's available
const allKeys = Object.keys(process.env).sort();
console.log("[DynamoDB] All env var keys:", JSON.stringify(allKeys));

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = "hotel-facilities";
