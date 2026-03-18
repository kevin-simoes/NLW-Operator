import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysisItems, roasts } from "@/db/schema";

export async function GET() {
  try {
    const roastsCount = await db.select().from(roasts).limit(1);
    const itemsCount = await db.select().from(analysisItems).limit(1);

    return NextResponse.json({
      status: "connected",
      tables: {
        roasts: "OK",
        analysisItems: "OK",
      },
      sampleData: {
        roasts: roastsCount.length,
        analysisItems: itemsCount.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
