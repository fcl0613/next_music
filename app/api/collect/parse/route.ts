import { NextRequest, NextResponse } from "next/server";
import { fetchVideoInfo, type BilibiliVideoInfo } from "@/lib/bilibili";
import { normalizeBvid, isValidBvid } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ParseResult {
  bvid: string;
  success: boolean;
  data?: BilibiliVideoInfo;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bvids } = body as { bvids: string[] };

    if (!Array.isArray(bvids) || bvids.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一个 BV 号" },
        { status: 400 }
      );
    }

    if (bvids.length > 20) {
      return NextResponse.json(
        { error: "单次最多解析 20 个视频" },
        { status: 400 }
      );
    }

    const cookie = process.env.BILIBILI_SESSDATA
      ? `SESSDATA=${process.env.BILIBILI_SESSDATA}`
      : undefined;

    const results: ParseResult[] = await Promise.all(
      bvids.map(async (raw) => {
        const bvid = normalizeBvid(raw);
        if (!isValidBvid(bvid)) {
          return { bvid, success: false, error: "BV 号格式不正确" };
        }
        try {
          const data = await fetchVideoInfo(bvid, cookie);
          return { bvid, success: true, data };
        } catch (err: any) {
          return { bvid, success: false, error: err.message || "解析失败" };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
