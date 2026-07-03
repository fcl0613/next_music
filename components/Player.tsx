'use client'

import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore, setAudioElement, type PlayMode } from '@/lib/store/player-store'
import { formatDuration } from '@/lib/utils'

// 播放模式图标和提示文字
const PLAY_MODE_CONFIG: Record<PlayMode, { icon: string; label: string }> = {
  list: {
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    label: '列表循环',
  },
  single: {
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    label: '单曲循环',
  },
  random: {
    icon: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3',
    label: '随机播放',
  },
}

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)
  const isDraggingProgress = useRef(false)

  const {
    currentMusic,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    queue,
    currentIndex,
    showPlaylist,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    setPlayMode,
    setCurrentTime,
    setDuration,
    togglePlaylist,
    playByIndex,
    removeFromQueue,
    clearQueue,
    setPlaybackRate,
    playbackRate,
  } = usePlayerStore()

  // 初始化 audio 元素
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      setAudioElement(audio)
      // 恢复音量
      audio.volume = volume
    }
    return () => {
      setAudioElement(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 同步播放状态到 audio 元素（页面刷新恢复后）
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentMusic) return

    // 如果 audio 的 src 不匹配当前音乐，更新 src
    const expectedSrc = `/api/audio/${currentMusic.id}`
    if (!audio.src || !audio.src.endsWith(expectedSrc)) {
      audio.src = expectedSrc
      audio.load()
      if (isPlaying) {
        audio.play().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMusic?.id])

  // audio 事件处理
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDraggingProgress.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [setDuration])

  const handleEnded = useCallback(() => {
    next()
  }, [next])

  const handleCanPlay = useCallback(() => {
    // 音频可以播放时，如果是播放状态则开始播放
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [isPlaying])

  // 进度条交互
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const time = percent * duration
      seek(Math.max(0, Math.min(time, duration)))
    },
    [duration, seek]
  )

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      isDraggingProgress.current = true
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      seek(percent * duration)

      const handleMouseMove = (me: MouseEvent) => {
        const newPercent = (me.clientX - rect.left) / rect.width
        seek(Math.max(0, Math.min(newPercent * duration, duration)))
      }

      const handleMouseUp = () => {
        isDraggingProgress.current = false
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [duration, seek]
  )

  // 音量条交互
  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      setVolume(Math.max(0, Math.min(percent, 1)))
    },
    [setVolume]
  )

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setVolume(Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1)))

      const handleMouseMove = (me: MouseEvent) => {
        setVolume(Math.max(0, Math.min((me.clientX - rect.left) / rect.width, 1)))
      }

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [setVolume]
  )

  // 切换播放模式
  const cyclePlayMode = useCallback(() => {
    const modes: PlayMode[] = ['list', 'single', 'random']
    const currentIdx = modes.indexOf(playMode)
    const nextIdx = (currentIdx + 1) % modes.length
    setPlayMode(modes[nextIdx])
  }, [playMode, setPlayMode])

  // 切换播放速率
  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 0.75]
    const currentIdx = rates.indexOf(playbackRate)
    const nextIdx = (currentIdx + 1) % rates.length
    setPlaybackRate(rates[nextIdx])
  }, [playbackRate, setPlaybackRate])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* 隐藏的 audio 元素 */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />

      {/* 播放列表抽屉 */}
      {showPlaylist && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={togglePlaylist}
        >
          <div
            className="absolute right-0 bottom-20 top-16 w-80 bg-white shadow-xl border-l border-gray-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                播放列表 ({queue.length})
              </h3>
              <button
                onClick={clearQueue}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                清空
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  播放列表为空
                </div>
              ) : (
                queue.map((music, index) => (
                  <div
                    key={`${music.id}-${index}`}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group ${
                      index === currentIndex ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => playByIndex(index)}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                      {music.coverUrl ? (
                        <img
                          src={music.coverUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs truncate ${
                          index === currentIndex
                            ? 'font-medium text-[#fe2c55]'
                            : 'text-gray-900'
                        }`}
                      >
                        {music.pageName || music.title}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {music.artist || '-'}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {formatDuration(music.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromQueue(index)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 播放器底栏 */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between h-full px-6 max-w-[1920px] mx-auto">
          {/* 当前播放信息 */}
          <div className="flex items-center gap-4 w-1/4 min-w-0">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              {currentMusic?.coverUrl ? (
                <img
                  src={currentMusic.coverUrl}
                  alt={currentMusic.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentMusic?.pageName || currentMusic?.title || '未播放'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentMusic?.artist || (currentMusic ? currentMusic.bvid : '-')}
              </p>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="flex flex-col items-center gap-2 w-2/4 max-w-xl">
            <div className="flex items-center gap-4">
              {/* 上一首 */}
              <button
                onClick={prev}
                disabled={!currentMusic}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                  />
                </svg>
              </button>
              {/* 播放/暂停 */}
              <button
                onClick={togglePlay}
                disabled={!currentMusic}
                className="w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              {/* 下一首 */}
              <button
                onClick={next}
                disabled={!currentMusic}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                  />
                </svg>
              </button>
              {/* 播放速率 */}
              <button
                onClick={cyclePlaybackRate}
                disabled={!currentMusic}
                className="px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-200 rounded transition-colors"
                title="播放速率"
              >
                {playbackRate}x
              </button>
            </div>
            {/* 进度条 */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
                {formatDuration(Math.floor(currentTime))}
              </span>
              <div
                ref={progressRef}
                className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
              >
                <div
                  className="h-full bg-gray-900 group-hover:bg-[#fe2c55] rounded-full transition-colors relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 group-hover:bg-[#fe2c55] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-10 tabular-nums">
                {formatDuration(Math.floor(duration))}
              </span>
            </div>
          </div>

          {/* 右侧控制区 */}
          <div className="flex items-center gap-4 w-1/4 justify-end">
            {/* 播放模式 */}
            <button
              onClick={cyclePlayMode}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors relative"
              title={PLAY_MODE_CONFIG[playMode].label}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={PLAY_MODE_CONFIG[playMode].icon}
                />
              </svg>
              {playMode === 'single' && (
                <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-gray-500">
                  1
                </span>
              )}
              {playMode === 'random' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#fe2c55] rounded-full" />
              )}
            </button>
            {/* 播放列表 */}
            <button
              onClick={togglePlaylist}
              className={`p-2 transition-colors ${
                showPlaylist
                  ? 'text-[#fe2c55]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="播放列表"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
            {/* 音量 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                {volume === 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>
              <div
                ref={volumeRef}
                className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={handleVolumeClick}
                onMouseDown={handleVolumeMouseDown}
              >
                <div
                  className="h-full bg-gray-900 group-hover:bg-[#fe2c55] rounded-full transition-colors relative"
                  style={{ width: `${volume * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-900 group-hover:bg-[#fe2c55] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
