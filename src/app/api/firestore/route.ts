import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { collectionName, documentId, data } = body;

    if (!collectionName || !documentId || !data) {
      return NextResponse.json(
        { success: false, error: "Missing collectionName, documentId, or data" },
        { status: 400 }
      );
    }

    // 1. If Enterprise Firestore MongoDB URI is set, sync directly using MongoDB driver
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && !mongoUri.includes("<username>")) {
      try {
        if (!cachedClient) {
          cachedClient = new MongoClient(mongoUri);
          await cachedClient.connect();
        }
        const db = cachedClient.db();
        const collection = db.collection(collectionName);
        await collection.updateOne(
          { _id: documentId as any },
          { $set: { ...data, updatedAt: new Date() } },
          { upsert: true }
        );
        console.log(`[Enterprise DB Sync] Document ${collectionName}/${documentId} upserted via MongoDB driver.`);
        return NextResponse.json({ success: true, mode: "mongodb-enterprise" });
      } catch (mongoErr: any) {
        console.error("[Enterprise DB Sync Error]", mongoErr.message);
      }
    }

    // 2. Standard REST Fallback
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "transport";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Firebase API Key not set in environment" },
        { status: 500 }
      );
    }

    // Convert JS Object data to Firestore REST Fields format
    const formattedFields: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === "string") {
        formattedFields[key] = { stringValue: val };
      } else if (typeof val === "number") {
        formattedFields[key] = Number.isInteger(val)
          ? { integerValue: val.toString() }
          : { doubleValue: val };
      } else if (typeof val === "boolean") {
        formattedFields[key] = { booleanValue: val };
      } else if (Array.isArray(val)) {
        formattedFields[key] = {
          arrayValue: {
            values: val.map((item) => ({
              stringValue: typeof item === "string" ? item : JSON.stringify(item),
            })),
          },
        };
      } else if (val && typeof val === "object") {
        formattedFields[key] = { stringValue: JSON.stringify(val) };
      }
    }

    const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${documentId}?key=${apiKey}`;

    const response = await fetch(restUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: formattedFields,
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, status: response.status, error: resData?.error?.message || "Firestore REST write failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, firestoreDoc: resData.name });
  } catch (err: any) {
    console.error("[Server Sync Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
