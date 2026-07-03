'use client'

import { useState } from 'react'

// 模拟歌单数据
const mockCollections = [
  { id: 1, name: '我喜欢的音乐', isDefault: true },
  { id: 2, name: '工作学习', isDefault: false },
  { id: 3, name: '运动健身', isDefault: false },
]

// 模拟分P数据
interface VideoPage {
  cid: number
  page: number
  part: string
  duration: number
}

interface VideoPreview {
  bvid: string
  title: string
  cover: string
  artist: string
  duration: number
  pages: VideoPage[]
}

interface CollectResult {
  bvid: string
  success: boolean
  title?: string
  reason?: string
}

export default function CollectPage() {
  const [inputValue, setInputValue] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<number>(1)
  const [selectedPages, setSelectedPages] = useState<Record<string, number[]>>({})
  const [previews, setPreviews] = useState<VideoPreview[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [results, setResults] = useState<CollectResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // 解析预览
  const handleParse = async () => {
    const bvids = inputValue
      .split(/[\n,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (bvids.length === 0) return

    setIsParsing(true)
    setShowResults(false)
    setResults([])

    // 模拟解析
    await new Promise((r) => setTimeout(r, 1000))

    const mockPreviews: VideoPreview[] = bvids.map((bvid, i) => ({
      bvid,
      title: `【音乐视频】示例标题 ${i + 1}`,
      cover: '',
      artist: `UP主_${i + 1}`,
      duration: 180 + i * 30,
      pages: [
        { cid: 1000 + i, page: 1, part: '默认分P', duration: 180 + i * 30 },
      ],
    }))

    setPreviews(mockPreviews)
    // 默认选中所有分P
    const defaultSelected: Record<string, number[]> = {}
    mockPreviews.forEach((p) => {
      defaultSelected[p.bvid] = p.pages.map((pg) => pg.page)
    })
    setSelectedPages(defaultSelected)
    setIsParsing(false)
  }

  // 切换分P选中
  const togglePage = (bvid: string, page: number) => {
    setSelectedPages((prev) => {
      const current = prev[bvid] || []
      const next = current.includes(page)
        ? current.filter((p) => p !== page)
        : [...current, page]
      return { ...prev, [bvid]: next }
    })
  }

  // 收录
  const handleCollect = async () => {
    setIsCollecting(true)
    setShowResults(false)

    // 模拟收录
    await new Promise((r) => setTimeout(r, 1500))

    const mockResults: CollectResult[] = previews.map((p) => ({
      bvid: p.bvid,
      success: Math.random() > 0.2,
      title: p.title,
      reason: '视频不存在或已被下架',
    }))

    setResults(mockResults)
    setShowResults(true)
    setIsCollecting(false)
  }

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // 模拟收录历史
  const recentHistory = [
    { id: 1, title: '【洛天依】千年食谱颂', bvid: 'BV1xx411c7mD', time: '2 小时前' },
    { id: 2, title: '周杰伦 - 晴天 (翻唱)', bvid: 'BV2xx411c7mE', time: '昨天' },
    { id: 3, title: '【纯音乐】深夜钢琴曲', bvid: 'BV3xx411c7mF', time: '3 天前' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">收录音乐</h1>
        <p className="mt-1 text-sm text-gray-500">
          输入 B 站 BV 号，一键收录你喜欢的音乐视频
        </p>
      </div>

      {/* 输入区 */}
      <section className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          BV 号输入
        </label>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={'请输入 BV 号，多个用换行或逗号分隔\n例如：\nBV1xx411c7mD\nBV2xx411c7mE'}
          rows={5}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20 focus:border-[#fe2c55] transition-all resize-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={!inputValue.trim() || isParsing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isParsing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                解析中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                解析预览
              </>
            )}
          </button>
          {previews.length > 0 && (
            <span className="text-sm text-gray-500">
              已解析 {previews.length} 个视频
            </span>
          )}
        </div>
      </section>

      {/* 预览区 */}
      {previews.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">解析预览</h2>
            {/* 收录选项 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">收录到：</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(Number(e.target.value))}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20 focus:border-[#fe2c55]"
              >
                {mockCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {previews.map((preview) => (
              <div
                key={preview.bvid}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                {/* 封面 */}
                <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {preview.cover ? (
                    <img
                      src={preview.cover}
                      alt={preview.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {preview.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {preview.artist} · {formatDuration(preview.duration)} · {preview.bvid}
                  </p>

                  {/* 分P选择 */}
                  {preview.pages.length > 1 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">选择分 P：</p>
                      <div className="flex flex-wrap gap-2">
                        {preview.pages.map((pg) => {
                          const isSelected = (selectedPages[preview.bvid] || []).includes(pg.page)
                          return (
                            <button
                              key={pg.page}
                              onClick={() => togglePage(preview.bvid, pg.page)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              P{pg.page} · {pg.part} ({formatDuration(pg.duration)})
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 收录按钮 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCollect}
              disabled={isCollecting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#fe2c55] hover:bg-[#e8264d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isCollecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  收录中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  开始收录
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* 收录结果 */}
      {showResults && results.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">收录结果</h2>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-100'
                    : 'bg-red-50 border-red-100'
                }`}
              >
                {result.success ? (
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.title || result.bvid}
                  </p>
                  {!result.success && result.reason && (
                    <p className="text-xs text-red-600 mt-0.5">{result.reason}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">{result.bvid}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-500">
            成功 {results.filter((r) => r.success).length} / 失败 {results.filter((r) => !r.success).length}
          </div>
        </section>
      )}

      {/* 最近收录 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">最近收录</h2>
        <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
          {recentHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100/50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{item.bvid}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
