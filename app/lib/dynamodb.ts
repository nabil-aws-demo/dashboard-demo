import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";

// Log all env vars starting with APP_ for debugging
const appEnvVars = Object.keys(process.env).filter(k => k.startsWith("APP_"));
console.log("[DynamoDB] APP_ env vars found:", appEnvVars);

const isLambda = !!process.env.LAMBDA_TASK_ROOT;
console.log("[DynamoDB] Running in Lambda:", isLambda);
console.log("[DynamoDB] APP_AWS_ACCESS_KEY_ID:", process.env.APP_AWS_ACCESS_KEY_ID ? "SET" : "NOT SET");

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
