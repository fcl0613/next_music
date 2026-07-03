import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// B 站音频质量优先级（从高到低）
const AUDIO_QUALITY_PRIORITY = [30250, 30280, 30232, 30216]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const musicId = Number(id)

    if (!musicId || isNaN(musicId)) {
      return NextResponse.json({ error: '无效的音乐 ID' }, { status: 400 })
    }

    // 1. 查询数据库中的音乐记录
    const music = await prisma.music.findUnique({
      where: { id: BigInt(musicId) },
    })

    if (!music) {
      return NextResponse.json({ error: '音乐不存在' }, { status: 404 })
    }

    // 2. 从请求头读取用户配置的 Cookie
    const biliCookie = req.headers.get('x-bili-cookie') || ''

    // 3. 检查数据库缓存是否有效
    const now = new Date()
    let audioUrl = music.audioUrl

    if (!audioUrl || !music.audioExpire || music.audioExpire <= now) {
      // 无缓存或已过期 → 调 B 站播放地址接口获取新音频流
      const newAudio = await fetchAudioStreamUrl(
        music.bvid,
        Number(music.cid),
        biliCookie
      )

      if (!newAudio) {
        // 获取失败，标记为 invalid
        await prisma.music.update({
          where: { id: BigInt(musicId) },
          data: { status: 'invalid' },
        })
        return NextResponse.json(
          { error: '无法获取音频流，视频可能已被下架' },
          { status: 404 }
        )
      }

      // 更新数据库缓存（2 小时后过期）
      const expireTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
      await prisma.music.update({
        where: { id: BigInt(musicId) },
        data: {
          audioUrl: newAudio.url,
          audioQuality: newAudio.quality,
          audioExpire: expireTime,
          status: 'active',
        },
      })

      audioUrl = newAudio.url
    }

    // 4. 代理请求 B 站音频流，支持 Range 请求（进度跳转）
    const range = req.headers.get('range')
    const headers: Record<string, string> = {
      Referer: 'https://www.bilibili.com',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    if (range) {
      headers['Range'] = range
    }

    const audioRes = await fetch(audioUrl!, { headers })

    if (!audioRes.ok && audioRes.status !== 206) {
      return NextResponse.json(
        { error: '音频流请求失败' },
        { status: audioRes.status }
      )
    }

    // 5. 构建响应头，流式转发
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', audioRes.headers.get('content-type') || 'audio/mp4')
    responseHeaders.set('Accept-Ranges', 'bytes')

    const contentLength = audioRes.headers.get('content-length')
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    }

    const contentRange = audioRes.headers.get('content-range')
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange)
    }

    // 缓存控制：允许浏览器缓存音频
    responseHeaders.set('Cache-Control', 'public, max-age=3600')

    return new Response(audioRes.body, {
      status: audioRes.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('音频代理错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

/**
 * 调用 B 站播放地址接口获取音频流 URL
 */
async function fetchAudioStreamUrl(
  bvid: string,
  cid: number,
  cookie?: string
): Promise<{ url: string; quality: number } | null> {
  try {
    const url = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&fnver=0&fourk=1`

    const headers: Record<string, string> = {
      Referer: 'https://www.bilibili.com',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    if (cookie) {
      headers['Cookie'] = cookie
    }

    const res = await fetch(url, { headers })
    const data = await res.json()

    if (data.code !== 0 || !data.data?.dash?.audio?.length) {
      console.error('B 站播放地址获取失败:', data)
      return null
    }

    const audioList = data.data.dash.audio as Array<{
      id: number
      baseUrl: string
      backupUrl?: string[]
      bandwidth: number
      codecs: string
    }>

    // 按质量优先级选择音频流
    for (const qualityId of AUDIO_QUALITY_PRIORITY) {
      const audio = audioList.find((a) => a.id === qualityId)
      if (audio) {
        return {
          url: audio.baseUrl,
          quality: qualityId,
        }
      }
    }

    // 降级：使用第一个可用的音频流
    const fallback = audioList[0]
    return {
      url: fallback.baseUrl,
      quality: fallback.id,
    }
  } catch (error) {
    console.error('获取 B 站音频流失败:', error)
    return null
  }
}
