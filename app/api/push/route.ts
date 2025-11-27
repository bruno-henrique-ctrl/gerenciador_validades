import { NextResponse } from "next/server";
import { redis } from "@/utils/db";

export async function POST(req: Request) {
    const sub = await req.json();

    await redis.lpush("push:subscribers", JSON.stringify(sub));

    return NextResponse.json({ ok: true });
}
