"use server";

import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "@/lib/dynamodb";
import { Hotel } from "@/lib/types";

export async function getHotels(): Promise<Hotel[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "HOTELS" },
    })
  );

  return (result.Items ?? []).map((item) => ({
    hotelId: item.hotelId,
    name: item.name,
    location: item.location,
    imageUrl: item.imageUrl,
  }));
}

export async function getHotelById(hotelId: string): Promise<Hotel | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `HOTEL#${hotelId}`,
        SK: "METADATA",
      },
    })
  );

  if (!result.Item) return null;

  return {
    hotelId: result.Item.hotelId,
    name: result.Item.name,
    location: result.Item.location,
    imageUrl: result.Item.imageUrl,
  };
}
