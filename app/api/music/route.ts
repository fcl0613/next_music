import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/music — 获取全部音乐列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50"))
    );

    const [musicList, total] = await Promise.all([
      prisma.music.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.music.count(),
    ]);

    const music = musicList.map((item) => ({
      id: Number(item.id),
      bvid: item.bvid,
      pageIndex: item.pageIndex,
      pageName: item.pageName,
      title: item.title,
      originalTitle: item.originalTitle,
      artist: item.artist,
      coverUrl: item.coverUrl,
      duration: item.duration,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({
      music,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
