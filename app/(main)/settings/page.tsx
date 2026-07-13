'use client'

import { useState, useEffect } from 'react'

// 音质选项
const QUALITY_OPTIONS = [
  { id: 30216, label: '64K 低品质', description: '适合网络较差的环境' },
  { id: 30232, label: '132K 标准品质', description: '平衡音质与流量' },
  { id: 30280, label: '192K 高品质', description: '推荐，较好的听感' },
  { id: 30250, label: 'Hi-Res 无损', description: '最高音质，流量消耗较大' },
]

// 播放模式选项
const PLAY_MODE_OPTIONS = [
  { id: 'list' as const, label: '列表循环', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { id: 'single' as const, label: '单曲循环', icon: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3' },
  { id: 'random' as const, label: '随机播放', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
]

export default function SettingsPage() {
  // B站 Cookie 配置
  const [biliCookie, setBiliCookie] = useState('')
  const [showCookie, setShowCookie] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // 播放偏好
  const [defaultQuality, setDefaultQuality] = useState(30280)
  const [defaultPlayMode, setDefaultPlayMode] = useState<'list' | 'single' | 'random'>('list')

  // 数据管理
  const [exporting, setExporting] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const [clearResult, setClearResult] = useState<string | null>(null)

  // 保存提示
  const [saved, setSaved] = useState(false)

  // 从 localStorage 加载设置
  useEffect(() => {
    const cookie = localStorage.getItem('bili_cookie') || ''
    const quality = parseInt(localStorage.getItem('default_quality') || '30280')
    const playMode = (localStorage.getItem('default_play_mode') || 'list') as 'list' | 'single' | 'random'

    setBiliCookie(cookie)
    setDefaultQuality(quality)
    setDefaultPlayMode(playMode)
  }, [])

  // 保存设置到 localStorage
  const handleSave = () => {
    localStorage.setItem('bili_cookie', biliCookie.trim())
    localStorage.setItem('default_quality', String(defaultQuality))
    localStorage.setItem('default_play_mode', defaultPlayMode)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 测试 Cookie 连接
  const handleTestCookie = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/collect/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(biliCookie.trim() ? { 'X-Bili-Cookie': biliCookie.trim() } : {}),
        },
        body: JSON.stringify({ bvids: ['BV1GJ411x7h7'] }),
      })
      const data = await res.json()

      if (res.ok && data.results?.[0]?.success) {
        setTestResult({ success: true, message: '连接成功，Cookie 有效' })
      } else {
        const error = data.results?.[0]?.error || data.error || '连接失败'
        setTestResult({ success: false, message: error })
      }
    } catch {
      setTestResult({ success: false, message: '网络错误，请检查服务是否正常' })
    }

    setTesting(false)
  }

  // 导出数据
  const handleExport = async () => {
    setExporting(true)

    try {
      const res = await fetch('/api/music/export')
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '导出失败')
        setExporting(false)
        return
      }

      // 下载 JSON 文件
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nest-music-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('网络错误，请稍后重试')
    }

    setExporting(false)
  }

  // 清除音频缓存
  const handleClearCache = async () => {
    if (!confirm('确定要清除所有音频缓存吗？下次播放时将重新获取音频地址。')) return

    setClearingCache(true)
    setClearResult(null)

    try {
      const res = await fetch('/api/music/clear-cache', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setClearResult(`已清除 ${data.count} 条音频缓存`)
      } else {
        setClearResult(data.error || '清除失败')
      }
    } catch {
      setClearResult('网络错误，请稍后重试')
    }

    setClearingCache(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="mt-1 text-sm text-gray-500">
          配置 B 站连接、播放偏好和数据管理
        </p>
      </div>

      {/* B站配置 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">B 站配置</h2>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="space-y-4">
            {/* Cookie 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SESSDATA Cookie
              </label>
              <p className="text-xs text-gray-500 mb-2">
                用于解析需要登录才能访问的视频。获取方式：浏览器 F12 → Application → Cookies → bilibili.com → 复制 SESSDATA 的值
              </p>
              <div className="relative">
                <input
                  type={showCookie ? 'text' : 'password'}
                  value={biliCookie}
                  onChange={(e) => setBiliCookie(e.target.value)}
                  placeholder="输入 SESSDATA 值"
                  className="w-full px-4 py-2.5 pr-20 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20 focus:border-[#fe2c55] transition-all font-mono"
                />
                <button
                  onClick={() => setShowCookie(!showCookie)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  {showCookie ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            {/* 测试连接 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestCookie}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-700 font-medium rounded-lg transition-colors"
              >
                {testing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    测试中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    测试连接
                  </>
                )}
              </button>

              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>
                  {testResult.success ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 播放偏好 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">播放偏好</h2>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="space-y-6">
            {/* 默认音质 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                默认音质
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUALITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDefaultQuality(option.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      defaultQuality === option.id
                        ? 'bg-white border-[#fe2c55] ring-1 ring-[#fe2c55]/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-medium ${defaultQuality === option.id ? 'text-[#fe2c55]' : 'text-gray-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 默认播放模式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                默认播放模式
              </label>
              <div className="flex gap-2">
                {PLAY_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDefaultPlayMode(option.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      defaultPlayMode === option.id
                        ? 'bg-white border-[#fe2c55] text-[#fe2c55] ring-1 ring-[#fe2c55]/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                    </svg>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 数据管理 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">数据管理</h2>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="space-y-4">
            {/* 导出数据 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">导出数据</p>
                <p className="text-xs text-gray-500 mt-0.5">将所有音乐和歌单数据导出为 JSON 文件</p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-700 font-medium rounded-lg transition-colors"
              >
                {exporting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    导出中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    导出 JSON
                  </>
                )}
              </button>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-200" />

            {/* 清除音频缓存 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">清除音频缓存</p>
                <p className="text-xs text-gray-500 mt-0.5">清除已缓存的音频地址，下次播放时将重新获取</p>
                {clearResult && (
                  <p className="text-xs text-green-600 mt-1">{clearResult}</p>
                )}
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-700 font-medium rounded-lg transition-colors"
              >
                {clearingCache ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    清除中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    清除缓存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          保存设置
        </button>

        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            已保存
          </span>
        )}
      </div>
    </div>
  )
}
