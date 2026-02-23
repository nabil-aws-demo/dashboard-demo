import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Amplify SSR uses a custom credential listener instead of standard Lambda metadata
// We need to fetch credentials from it manually
async function getAmplifyCredentials() {
  const host = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_HOST;
  const port = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_PORT;
  const path = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_PATH ?? "/credentials";

  if (!host || !port) return undefined;

  try {
    const url = `http://${host}:${port}${path}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json() as {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    return {
      accessKeyId: data.accessKeyId,
      secretAccessKey: data.secretAccessKey,
      sessionToken: data.sessionToken,
    };
  } catch {
    return undefined;
  }
}

let cachedCredentials: Awaited<ReturnType<typeof getAmplifyCredentials>> = undefined;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: async () => {
    if (!cachedCredentials) {
      cachedCredentials = await getAmplifyCredentials();
    }
    if (cachedCredentials) return cachedCredentials;
    throw new Error("Could not load Amplify credentials");
  },
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = "hotel-facilities";
