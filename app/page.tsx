'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatDuration } from '@/lib/utils'
import { usePlayerStore, type MusicItem } from '@/lib/store/player-store'

interface Collection {
  id: number
  name: string
  isDefault: boolean
  count: number
}

// MusicItem 类型从 store 导入

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const [collections, setCollections] = useState<Collection[]>([])
  const [activeCollection, setActiveCollection] = useState<number | null>(null)
  const [musicList, setMusicList] = useState<MusicItem[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [loadingMusic, setLoadingMusic] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // 播放器状态
  const { currentMusic, isPlaying, play } = usePlayerStore()

  // 播放指定音乐
  const handlePlayMusic = useCallback(
    (music: MusicItem) => {
      play(music, musicList)
    },
    [play, musicList]
  )

  // 播放全部
  const handlePlayAll = useCallback(() => {
    if (musicList.length === 0) return
    play(musicList[0], musicList)
  }, [play, musicList])
  // 加载歌单列表
  useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(data.collections)
          // 从 URL 参数恢复选中状态
          const cid = searchParams.get('collection')
          if (cid) {
            const id = Number(cid)
            if (data.collections.some((c: Collection) => c.id === id)) {
              setActiveCollection(id)
              return
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCollections(false))
  }, [searchParams])

  // 加载音乐列表
  const fetchMusic = useCallback(async (collectionId: number | null) => {
    setLoadingMusic(true)
    setMusicList([])

    try {
      if (collectionId === null) {
        // 全部音乐 — 获取所有音乐
        const res = await fetch('/api/music?pageSize=200')
        const data = await res.json()
        if (data.music) {
          setMusicList(data.music)
        }
      } else {
        const res = await fetch(`/api/collections/${collectionId}/music?pageSize=200`)
        const data = await res.json()
        if (data.music) {
          setMusicList(data.music)
        }
      }
    } catch {
      // ignore
    }

    setLoadingMusic(false)
  }, [])

  // 歌单列表加载完成后或切换歌单时加载音乐
  useEffect(() => {
    if (!loadingCollections) {
      fetchMusic(activeCollection)
    }
  }, [activeCollection, loadingCollections, fetchMusic])

  // 当前歌单名称
  const currentCollectionName = activeCollection === null
    ? '全部音乐'
    : collections.find((c) => c.id === activeCollection)?.name || '未知歌单'

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 左侧歌单列表 */}
      <aside className="w-64 border-r border-gray-100 bg-gray-50/50 overflow-y-auto shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">歌单</h2>
            <Link
              href="/collections"
              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="管理歌单"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>

          {loadingCollections ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <nav className="space-y-1">
              {/* 全部音乐 */}
              <button
                onClick={() => setActiveCollection(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeCollection === null
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span>全部音乐</span>
              </button>

              {/* 歌单列表 */}
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setActiveCollection(collection.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeCollection === collection.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{collection.count}</span>
                </button>
              ))}

              {/* 管理歌单入口 */}
              <Link
                href="/collections"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>管理歌单</span>
              </Link>
            </nav>
          )}
        </div>
      </aside>

      {/* 右侧音乐列表 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentCollectionName}
            </h1>
            <span className="text-sm text-gray-500">{musicList.length} 首</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 播放全部按钮 */}
            <button
              onClick={handlePlayAll}
              disabled={musicList.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              播放全部
            </button>
            {/* 视图切换 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingMusic ? (
            <div className="flex items-center justify-center h-full">
              <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : musicList.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有音乐</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                通过 B 站 BV 号收录你喜欢的音乐视频，建立你的个人音乐库
              </p>
              <Link
                href="/collect"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                去收录
              </Link>
            </div>
          ) : viewMode === 'table' ? (
            /* 列表视图 */
            <div className="space-y-1">
              {/* 表头 */}
              <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">标题</span>
                <span className="w-32">艺术家</span>
                <span className="w-20 text-right">时长</span>
              </div>
              {musicList.map((music, index) => {
                const isActive = currentMusic?.id === music.id
                return (
                <div
                  key={music.id}
                  onClick={() => handlePlayMusic(music)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className={`w-8 text-center text-sm group-hover:hidden ${isActive ? 'text-[#fe2c55] font-medium' : 'text-gray-400'}`}>
                    {isActive && isPlaying ? (
                      <span className="inline-flex gap-0.5 items-end h-4">
                        <span className="w-0.5 bg-[#fe2c55] animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                        <span className="w-0.5 bg-[#fe2c55] animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <span className="w-0.5 bg-[#fe2c55] animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                      </span>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <svg className="w-8 h-8 text-gray-900 hidden group-hover:block" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                      {music.coverUrl ? (
                        <img
                          src={music.coverUrl}
                          alt={music.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-[#fe2c55]' : 'text-gray-900'}`}>
                        {music.pageName || music.title}
                      </p>
                      {music.pageName && (
                        <p className="text-xs text-gray-500 truncate">{music.title}</p>
                      )}
                    </div>
                  </div>
                  <span className="w-32 text-sm text-gray-500 truncate">
                    {music.artist || '-'}
                  </span>
                  <span className="w-20 text-right text-sm text-gray-500">
                    {formatDuration(music.duration)}
                  </span>
                </div>
              )
              })}
            </div>
          ) : (
            /* 网格视图 */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {musicList.map((music) => {
                const isActive = currentMusic?.id === music.id
                return (
                <div
                  key={music.id}
                  onClick={() => handlePlayMusic(music)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                    {music.coverUrl ? (
                      <img
                        src={music.coverUrl}
                        alt={music.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                    {/* 播放按钮覆盖层 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-[#fe2c55]' : 'text-gray-900'}`}>
                    {music.pageName || music.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {music.artist || music.bvid}
                  </p>
                </div>
              )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
