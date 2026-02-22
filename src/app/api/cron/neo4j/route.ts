import { NextRequest, NextResponse } from "next/server";
import { getDriver } from "@/lib/services/neo4j";

// API used by Vercel cron job to keep Neo4j connection alive.
// Called every 5 minutes via vercel.json schedule.
export async function GET(req: NextRequest) {
  try {
    const driver = getDriver();
    const session = driver.session({
      database: process.env.NEO4J_DATABASE || "neo4j",
    });
    await session.run("RETURN 1");
    await session.close();
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[Cron] Neo4j keep-alive failed:", err);
    return new NextResponse("error", { status: 500 });
  }
}
