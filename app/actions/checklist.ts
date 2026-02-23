"use server";

import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "@/lib/dynamodb";
import { ChecklistItem } from "@/lib/types";

export async function getChecklistItems(roomId: string): Promise<ChecklistItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `ROOM#${roomId}`,
        ":skPrefix": "CHECKLIST#",
      },
    })
  );

  return (result.Items ?? []).map((item) => ({
    itemId: item.itemId as string,
    roomId: item.roomId as string,
    category: item.category,
    itemName: item.itemName as string,
    isChecked: item.isChecked as boolean,
    checkedAt: (item.checkedAt as string | null) ?? null,
  }));
}

export async function toggleChecklistItem(
  itemId: string,
  roomId: string,
  isChecked: boolean
): Promise<void> {
  const now = new Date().toISOString();
  const checkedAt = isChecked ? now : null;

  // itemId format: "<hotelId>#<roomNumber>#<category>#<itemName_underscored>"
  // SK stored as: "CHECKLIST#<category>#<itemId>"
  // Extract category: roomId is "<hotelId>#<roomNumber>" (2 segments), so category is at index 2
  const itemParts = itemId.split("#");
  const category = itemParts[2];

  // Update the checklist item
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ROOM#${roomId}`,
        SK: `CHECKLIST#${category}#${itemId}`,
      },
      UpdateExpression: "SET isChecked = :checked, checkedAt = :checkedAt",
      ExpressionAttributeValues: {
        ":checked": isChecked,
        ":checkedAt": checkedAt,
      },
    })
  );

  // Update room's lastUpdated
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET lastUpdated = :ts",
      ExpressionAttributeValues: {
        ":ts": now,
      },
    })
  );
}
