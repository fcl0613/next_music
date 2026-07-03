import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/music/export — 导出所有音乐和歌单数据
export async function GET() {
  try {
    const [musicList, collections] = await Promise.all([
      prisma.music.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.collection.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              music: {
                select: {
                  id: true,
                  bvid: true,
                  title: true,
                  artist: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      music: musicList.map((m) => ({
        id: Number(m.id),
        bvid: m.bvid,
        aid: m.aid ? Number(m.aid) : null,
        cid: Number(m.cid),
        pageIndex: m.pageIndex,
        pageName: m.pageName,
        title: m.title,
        originalTitle: m.originalTitle,
        artist: m.artist,
        coverUrl: m.coverUrl,
        duration: m.duration,
        status: m.status,
        tags: m.tags.map((mt) => mt.tag.name),
        createdAt: m.createdAt.toISOString(),
      })),
      collections: collections.map((c) => ({
        id: Number(c.id),
        name: c.name,
        description: c.description,
        isDefault: c.isDefault,
        musicCount: c.items.length,
        items: c.items.map((item) => ({
          musicId: Number(item.musicId),
          bvid: item.music.bvid,
          title: item.music.title,
          sortOrder: item.sortOrder,
        })),
        createdAt: c.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(exportData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "导出失败" },
      { status: 500 }
    );
  }
}
