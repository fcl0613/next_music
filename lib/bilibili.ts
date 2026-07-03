/**
 * Bilibili API 工具函数
 */

export interface BilibiliVideoPage {
  cid: number;
  page: number;
  part: string;
  duration: number;
}

export interface BilibiliVideoInfo {
  bvid: string;
  aid: number;
  title: string;
  cover: string;
  artist: string;
  duration: number;
  pages: BilibiliVideoPage[];
}

/**
 * 从 Bilibili API 获取视频信息
 * @param bvid 视频 BV 号
 * @param cookie 可选的 Cookie 字符串（含 SESSDATA）
 */
export async function fetchVideoInfo(
  bvid: string,
  cookie?: string
): Promise<BilibiliVideoInfo> {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`;

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.bilibili.com",
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(url, { headers, next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`Bilibili API 请求失败: ${res.status}`);
  }

  const json = await res.json();

  if (json.code !== 0) {
    throw new Error(json.message || "获取视频信息失败");
  }

  const data = json.data;

  return {
    bvid: data.bvid,
    aid: data.aid,
    title: data.title,
    cover: data.pic?.startsWith("//") ? `https:${data.pic}` : data.pic,
    artist: data.owner?.name ?? "",
    duration: data.duration ?? 0,
    pages: (data.pages ?? []).map((p: any) => ({
      cid: p.cid,
      page: p.page,
      part: p.part || `P${p.page}`,
      duration: p.duration ?? 0,
    })),
  };
}
