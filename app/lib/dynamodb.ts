import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

async function getAmplifyCredentials() {
  const host = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_HOST;
  const port = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_PORT;
  const path = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_PATH ?? "/credentials";
  const enabled = process.env.AWS_AMPLIFY_CREDENTIAL_LISTENER_ENABLED;

  console.log("[Creds] enabled:", enabled, "host:", host, "port:", port, "path:", path);

  if (!host || !port) {
    console.log("[Creds] Missing host or port");
    return undefined;
  }

  try {
    const url = `http://${host}:${port}${path}`;
    console.log("[Creds] Fetching:", url);
    const res = await fetch(url);
    console.log("[Creds] Response status:", res.status);
    if (!res.ok) {
      const text = await res.text();
      console.log("[Creds] Response body:", text);
      return undefined;
    }
    const data = await res.json() as {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    console.log("[Creds] Got credentials, accessKeyId starts with:", data.accessKeyId?.slice(0, 4));
    return {
      accessKeyId: data.accessKeyId,
      secretAccessKey: data.secretAccessKey,
      sessionToken: data.sessionToken,
    };
  } catch (e) {
    console.log("[Creds] Fetch error:", e);
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
