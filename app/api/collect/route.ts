import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchVideoInfo } from "@/lib/bilibili";
import { normalizeBvid, isValidBvid } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CollectItem {
  bvid: string;
  pages: number[]; // 分P 索引列表（从 1 开始）
  collectionId: number;
}

interface CollectResult {
  bvid: string;
  pageIndex: number;
  success: boolean;
  musicId?: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: CollectItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "请提供收录数据" },
        { status: 400 }
      );
    }

    const cookie = process.env.BILIBILI_SESSDATA
      ? `SESSDATA=${process.env.BILIBILI_SESSDATA}`
      : undefined;

    const allResults: CollectResult[] = [];

    for (const item of items) {
      const bvid = normalizeBvid(item.bvid);

      if (!isValidBvid(bvid)) {
        for (const page of item.pages) {
          allResults.push({
            bvid,
            pageIndex: page,
            success: false,
            reason: "BV 号格式不正确",
          });
        }
        continue;
      }

      // 获取视频信息
      let videoInfo;
      try {
        videoInfo = await fetchVideoInfo(bvid, cookie);
      } catch (err: any) {
        for (const page of item.pages) {
          allResults.push({
            bvid,
            pageIndex: page,
            success: false,
            reason: err.message || "获取视频信息失败",
          });
        }
        continue;
      }

      // 验证歌单存在
      const collection = await prisma.collection.findUnique({
        where: { id: BigInt(item.collectionId) },
      });
      if (!collection) {
        for (const page of item.pages) {
          allResults.push({
            bvid,
            pageIndex: page,
            success: false,
            reason: "歌单不存在",
          });
        }
        continue;
      }

      // 处理每个分P
      for (const pageIndex of item.pages) {
        const pageData = videoInfo.pages.find((p) => p.page === pageIndex);
        if (!pageData) {
          allResults.push({
            bvid,
            pageIndex,
            success: false,
            reason: `分P ${pageIndex} 不存在`,
          });
          continue;
        }

        try {
          // 使用 upsert 处理唯一约束 [bvid, pageIndex]
          const music = await prisma.music.upsert({
            where: {
              bvid_pageIndex: { bvid, pageIndex },
            },
            create: {
              bvid,
              aid: BigInt(videoInfo.aid),
              cid: BigInt(pageData.cid),
              pageIndex,
              pageName: pageData.part,
              title: videoInfo.title,
              artist: videoInfo.artist,
              coverUrl: videoInfo.cover,
              duration: pageData.duration,
            },
            update: {
              // 已存在则更新封面等可能变化的字段
              coverUrl: videoInfo.cover,
              artist: videoInfo.artist,
              title: videoInfo.title,
            },
          });

          // 创建歌单关联（如不存在）
          await prisma.collectionItem.upsert({
            where: {
              collectionId_musicId: {
                collectionId: BigInt(item.collectionId),
                musicId: music.id,
              },
            },
            create: {
              collectionId: BigInt(item.collectionId),
              musicId: music.id,
            },
            update: {},
          });

          allResults.push({
            bvid,
            pageIndex,
            success: true,
            musicId: music.id.toString(),
          });
        } catch (err: any) {
          allResults.push({
            bvid,
            pageIndex,
            success: false,
            reason: err.message || "收录失败",
          });
        }
      }
    }

    return NextResponse.json({ results: allResults });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
