"use server";

import { GetCommand, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "@/lib/dynamodb";
import { Room, RoomWithHotel } from "@/lib/types";
import { deriveRoomStatus } from "@/lib/status";
import { getHotelById } from "./hotel";

function mapRoomItem(item: Record<string, unknown>): Room {
  return {
    roomId: item.roomId as string,
    hotelId: item.hotelId as string,
    roomNumber: item.roomNumber as number,
    occupiedOverride: item.occupiedOverride as boolean,
    notes: (item.notes as string) ?? "",
    lastUpdated: item.lastUpdated as string,
    status: "Needs Attention", // placeholder — caller must derive
  };
}

export async function getRoomsByHotel(hotelId: string): Promise<Room[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `HOTEL#${hotelId}`,
        ":skPrefix": "ROOM#",
      },
    })
  );

  return (result.Items ?? []).map((item) => mapRoomItem(item as Record<string, unknown>));
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
      },
    })
  );

  if (!result.Item) return null;
  return mapRoomItem(result.Item as Record<string, unknown>);
}

export async function updateRoomNotes(roomId: string, notes: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET notes = :notes, lastUpdated = :ts",
      ExpressionAttributeValues: {
        ":notes": notes,
        ":ts": new Date().toISOString(),
      },
    })
  );
}

export async function setRoomOccupied(roomId: string, occupied: boolean): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET occupiedOverride = :occupied, lastUpdated = :ts",
      ExpressionAttributeValues: {
        ":occupied": occupied,
        ":ts": new Date().toISOString(),
      },
    })
  );
}

export async function getAllRoomsNeedingAttention(): Promise<RoomWithHotel[]> {
  // Scan all room METADATA items
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" },
    })
  );

  const roomItems = (result.Items ?? []).filter(
    (item) => typeof item.roomId === "string" && item.roomId !== undefined
  );

  const roomsWithStatus: RoomWithHotel[] = [];

  for (const item of roomItems) {
    // Fetch checklist items for this room to derive status
    const checklistResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `ROOM#${item.roomId}`,
          ":skPrefix": "CHECKLIST#",
        },
      })
    );

    const checklistItems = (checklistResult.Items ?? []).map((ci) => ({
      itemId: ci.itemId as string,
      roomId: ci.roomId as string,
      category: ci.category,
      itemName: ci.itemName as string,
      isChecked: ci.isChecked as boolean,
      checkedAt: ci.checkedAt as string | null,
    }));

    const status = deriveRoomStatus(checklistItems, item.occupiedOverride as boolean);

    if (status === "Needs Attention" || status === "In Progress") {
      const hotel = await getHotelById(item.hotelId as string);
      roomsWithStatus.push({
        roomId: item.roomId as string,
        hotelId: item.hotelId as string,
        roomNumber: item.roomNumber as number,
        occupiedOverride: item.occupiedOverride as boolean,
        notes: (item.notes as string) ?? "",
        lastUpdated: item.lastUpdated as string,
        status,
        hotelName: hotel?.name ?? item.hotelId as string,
      });
    }
  }

  return roomsWithStatus;
}
