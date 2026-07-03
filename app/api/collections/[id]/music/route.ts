import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/collections/:id/music — 获取歌单内的音乐列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collectionId = BigInt(id);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50"))
    );

    // 检查歌单是否存在
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) {
      return NextResponse.json({ error: "歌单不存在" }, { status: 404 });
    }

    const [items, total] = await Promise.all([
      prisma.collectionItem.findMany({
        where: { collectionId },
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          music: true,
        },
      }),
      prisma.collectionItem.count({
        where: { collectionId },
      }),
    ]);

    const musicList = items.map((item) => ({
      id: Number(item.music.id),
      bvid: item.music.bvid,
      pageIndex: item.music.pageIndex,
      pageName: item.music.pageName,
      title: item.music.title,
      originalTitle: item.music.originalTitle,
      artist: item.music.artist,
      coverUrl: item.music.coverUrl,
      duration: item.music.duration,
      status: item.music.status,
      createdAt: item.music.createdAt.toISOString(),
    }));

    return NextResponse.json({
      collection: {
        id: Number(collection.id),
        name: collection.name,
        description: collection.description,
      },
      music: musicList,
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
