import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/music/clear-cache — 清除所有音频缓存
export async function POST() {
  try {
    const result = await prisma.music.updateMany({
      where: {
        audioUrl: { not: null },
      },
      data: {
        audioUrl: null,
        audioQuality: null,
        audioExpire: null,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "清除缓存失败" },
      { status: 500 }
    );
  }
}
