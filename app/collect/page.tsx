'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDuration } from '@/lib/utils'

// 类型定义
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
  pageIndex: number
  success: boolean
  title?: string
  reason?: string
}

interface CollectionOption {
  id: number
  name: string
  isDefault: boolean
  count: number
}

export default function CollectPage() {
  const [inputValue, setInputValue] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<number>(0)
  const [selectedPages, setSelectedPages] = useState<Record<string, number[]>>({})
  const [previews, setPreviews] = useState<VideoPreview[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [results, setResults] = useState<CollectResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [parseErrors, setParseErrors] = useState<Record<string, string>>({})

  // 加载歌单列表
  useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(data.collections)
          // 默认选中默认歌单
          const defaultCol = data.collections.find((c: CollectionOption) => c.isDefault)
          if (defaultCol) setSelectedCollection(defaultCol.id)
          else if (data.collections.length > 0) setSelectedCollection(data.collections[0].id)
        }
      })
      .catch(() => {})
  }, [])

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
    setParseErrors({})

    try {
      const res = await fetch('/api/collect/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvids }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '解析请求失败')
        setIsParsing(false)
        return
      }

      const successPreviews: VideoPreview[] = []
      const errors: Record<string, string> = {}

      for (const r of data.results) {
        if (r.success && r.data) {
          successPreviews.push({
            bvid: r.data.bvid,
            title: r.data.title,
            cover: r.data.cover,
            artist: r.data.artist,
            duration: r.data.duration,
            pages: r.data.pages,
          })
        } else {
          errors[r.bvid] = r.error || '解析失败'
        }
      }

      setPreviews(successPreviews)
      setParseErrors(errors)

      // 默认选中所有分P
      const defaultSelected: Record<string, number[]> = {}
      successPreviews.forEach((p) => {
        defaultSelected[p.bvid] = p.pages.map((pg) => pg.page)
      })
      setSelectedPages(defaultSelected)
    } catch {
      alert('网络错误，请稍后重试')
    }

    setIsParsing(false)
  }

  // 切换分P选中
  const togglePage = useCallback((bvid: string, page: number) => {
    setSelectedPages((prev) => {
      const current = prev[bvid] || []
      const next = current.includes(page)
        ? current.filter((p) => p !== page)
        : [...current, page]
      return { ...prev, [bvid]: next }
    })
  }, [])

  // 收录
  const handleCollect = async () => {
    if (!selectedCollection) {
      alert('请选择歌单')
      return
    }

    const items = previews
      .map((p) => ({
        bvid: p.bvid,
        pages: selectedPages[p.bvid] || [],
        collectionId: selectedCollection,
      }))
      .filter((item) => item.pages.length > 0)

    if (items.length === 0) {
      alert('请至少选择一个分P')
      return
    }

    setIsCollecting(true)
    setShowResults(false)

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '收录请求失败')
        setIsCollecting(false)
        return
      }

      // 把 title 补上
      const resultsWithTitle = data.results.map((r: CollectResult) => {
        const preview = previews.find((p) => p.bvid === r.bvid)
        return { ...r, title: preview?.title || r.bvid }
      })

      setResults(resultsWithTitle)
      setShowResults(true)
    } catch {
      alert('网络错误，请稍后重试')
    }

    setIsCollecting(false)
  }

  // 计算已选分P总数
  const totalSelectedPages = Object.values(selectedPages).reduce(
    (sum, pages) => sum + pages.length,
    0
  )

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
          placeholder={'请输入 BV 号，多个用换行或逗号分隔\n例如：\nBV1GJ411x7h7\nBV1xx411c7mD'}
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

        {/* 解析错误提示 */}
        {Object.keys(parseErrors).length > 0 && (
          <div className="mt-3 space-y-1">
            {Object.entries(parseErrors).map(([bvid, error]) => (
              <p key={bvid} className="text-xs text-red-500">
                {bvid}：{error}
              </p>
            ))}
          </div>
        )}
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
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
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
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
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
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              已选 {totalSelectedPages} 个分P
            </span>
            <button
              onClick={handleCollect}
              disabled={isCollecting || totalSelectedPages === 0 || !selectedCollection}
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
                  开始收录 ({totalSelectedPages})
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
                    {result.pageIndex > 1 && (
                      <span className="text-xs font-normal ml-1">P{result.pageIndex}</span>
                    )}
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
    </div>
  )
}
