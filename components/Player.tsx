'use client'

import { useState } from 'react'

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between h-full px-6 max-w-[1920px] mx-auto">
        {/* 当前播放信息 */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
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
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">未播放</p>
            <p className="text-xs text-gray-500 truncate">-</p>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex flex-col items-center gap-2 w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
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
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
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
          </div>
          {/* 进度条 */}
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 text-right">0:00</span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden cursor-pointer group">
              <div className="h-full bg-gray-900 rounded-full w-0 group-hover:bg-[#fe2c55] transition-colors" />
            </div>
            <span className="text-xs text-gray-500 w-10">0:00</span>
          </div>
        </div>

        {/* 音量和播放列表 */}
        <div className="flex items-center gap-4 w-1/4 justify-end">
          {/* 播放模式 */}
          <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          {/* 播放列表 */}
          <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
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
            <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
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
            </button>
            <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden cursor-pointer">
              <div
                className="h-full bg-gray-900 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
