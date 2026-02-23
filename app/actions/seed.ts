"use server";

import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "@/lib/dynamodb";
import { CHECKLIST_ITEMS } from "@/lib/constants";

const HOTELS = [
  {
    hotelId: "palm",
    name: "One&Only The Palm",
    location: "Palm Jumeirah, Dubai",
    imageUrl: "https://www.oneandonlyresorts.com/-/media/oneandonly/the-palm/homepage/ootp-hero-image.jpg",
  },
  {
    hotelId: "difc",
    name: "One&Only DIFC",
    location: "DIFC, Dubai",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// DynamoDB BatchWrite accepts max 25 items per call
// Adds delay between chunks to avoid ProvisionedThroughputExceededException
async function batchWrite(items: Record<string, unknown>[]) {
  const chunks: Record<string, unknown>[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    let retries = 0;
    while (true) {
      try {
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: chunk.map((Item) => ({ PutRequest: { Item } })),
            },
          })
        );
        // Small delay between chunks to stay within provisioned throughput
        await sleep(200);
        break;
      } catch (err: unknown) {
        const name = (err as { name?: string }).name;
        if (name === "ProvisionedThroughputExceededException" && retries < 5) {
          retries++;
          await sleep(500 * retries); // exponential-ish backoff
        } else {
          throw err;
        }
      }
    }
  }
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  // Check if all hotels already exist (expect exactly 2)
  const existing = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "HOTELS" },
    })
  );

  if (existing.Count && existing.Count >= 2) {
    return; // Already fully seeded — preserve existing state
  }

  const now = new Date().toISOString();
  const allItems: Record<string, unknown>[] = [];

  for (const hotel of HOTELS) {
    // Hotel item
    allItems.push({
      PK: `HOTEL#${hotel.hotelId}`,
      SK: "METADATA",
      GSI1PK: "HOTELS",
      GSI1SK: `HOTEL#${hotel.hotelId}`,
      hotelId: hotel.hotelId,
      name: hotel.name,
      location: hotel.location,
      imageUrl: hotel.imageUrl,
      createdAt: now,
    });

    for (let roomNumber = 1001; roomNumber <= 1010; roomNumber++) {
      const roomId = `${hotel.hotelId}#${roomNumber}`;

      // Room item
      allItems.push({
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
        GSI1PK: `HOTEL#${hotel.hotelId}`,
        GSI1SK: `ROOM#${roomNumber}`,
        roomId,
        hotelId: hotel.hotelId,
        roomNumber,
        occupiedOverride: false,
        notes: "",
        lastUpdated: now,
      });

      // Checklist items for this room
      for (const item of CHECKLIST_ITEMS) {
        const itemId = `${roomId}#${item.category}#${item.itemName.replace(/\s+/g, "_")}`;
        allItems.push({
          PK: `ROOM#${roomId}`,
          SK: `CHECKLIST#${item.category}#${itemId}`,
          itemId,
          roomId,
          hotelId: hotel.hotelId,
          category: item.category,
          itemName: item.itemName,
          isChecked: false,
          checkedAt: null,
        });
      }
    }
  }

  await batchWrite(allItems);
}
