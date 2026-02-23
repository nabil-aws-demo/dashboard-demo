import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function updateImages() {
  await docClient.send(
    new UpdateCommand({
      TableName: "hotel-facilities",
      Key: { PK: "HOTEL#palm", SK: "METADATA" },
      UpdateExpression: "SET imageUrl = :url",
      ExpressionAttributeValues: {
        ":url": "/ootp-hero-image.jpg",
      },
    })
  );
  console.log("Palm image updated.");

  await docClient.send(
    new UpdateCommand({
      TableName: "hotel-facilities",
      Key: { PK: "HOTEL#difc", SK: "METADATA" },
      UpdateExpression: "SET imageUrl = :url",
      ExpressionAttributeValues: {
        ":url": "/oooz-hero-image.jpg",
      },
    })
  );
  console.log("DIFC image updated.");
}

updateImages().catch(console.error);
