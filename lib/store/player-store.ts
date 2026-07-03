import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 音乐条目类型（与 API 返回一致，id 为 number）
export interface MusicItem {
  id: number
  bvid: string
  pageIndex: number
  pageName: string | null
  title: string
  artist: string | null
  coverUrl: string | null
  duration: number
  status: string
  createdAt: string
}

export type PlayMode = 'list' | 'single' | 'random'

interface PlayerState {
  // 当前播放
  currentMusic: MusicItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number

  // 播放队列
  queue: MusicItem[]
  currentIndex: number

  // 播放模式
  playMode: PlayMode

  // 播放列表抽屉
  showPlaylist: boolean
}

interface PlayerActions {
  play: (music: MusicItem, queue?: MusicItem[]) => void
  togglePlay: () => void
  pause: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  setPlaybackRate: (rate: number) => void
  setPlayMode: (mode: PlayMode) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  addToQueue: (music: MusicItem) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  togglePlaylist: () => void
  playByIndex: (index: number) => void
}

// 模块级 audio 元素引用，由 Player 组件挂载时设置
let audioElement: HTMLAudioElement | null = null

export function setAudioElement(el: HTMLAudioElement | null) {
  audioElement = el
}

export function getAudioElement() {
  return audioElement
}

// 从 localStorage 读取 Cookie
function getBiliCookie(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('bili_cookie') || ''
}

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentMusic: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      playbackRate: 1,
      queue: [],
      currentIndex: -1,
      playMode: 'list',
      showPlaylist: false,

      // 播放指定音乐
      play: (music: MusicItem, queue?: MusicItem[]) => {
        const state = get()
        let newQueue = state.queue
        let newIndex = 0

        if (queue && queue.length > 0) {
          // 提供了新的播放队列
          newQueue = queue
          newIndex = queue.findIndex((m) => m.id === music.id)
          if (newIndex === -1) newIndex = 0
        } else if (state.queue.length > 0) {
          // 未提供新队列，检查当前队列中是否存在
          const existIndex = state.queue.findIndex((m) => m.id === music.id)
          if (existIndex !== -1) {
            newIndex = existIndex
          } else {
            // 追加到队列末尾
            newQueue = [...state.queue, music]
            newIndex = newQueue.length - 1
          }
        } else {
          // 队列为空，创建新队列
          newQueue = [music]
          newIndex = 0
        }

        set({
          currentMusic: music,
          queue: newQueue,
          currentIndex: newIndex,
          isPlaying: true,
          currentTime: 0,
          duration: music.duration || 0,
        })

        // 设置音频源并播放
        if (audioElement) {
          const cookie = getBiliCookie()
          audioElement.src = `/api/audio/${music.id}`
          if (cookie) {
            audioElement.setAttribute('data-bili-cookie', cookie)
          }
          audioElement.load()
          audioElement.play().catch(() => {
            // 自动播放可能被浏览器阻止
          })
        }
      },

      // 切换播放/暂停
      togglePlay: () => {
        const state = get()
        if (!state.currentMusic || !audioElement) return

        if (state.isPlaying) {
          audioElement.pause()
          set({ isPlaying: false })
        } else {
          audioElement.play().catch(() => {})
          set({ isPlaying: true })
        }
      },

      // 暂停
      pause: () => {
        if (audioElement) {
          audioElement.pause()
        }
        set({ isPlaying: false })
      },

      // 下一首
      next: () => {
        const { queue, currentIndex, playMode } = get()
        if (queue.length === 0) return

        let nextIndex: number

        if (playMode === 'single') {
          // 单曲循环：重新播放当前歌曲
          nextIndex = currentIndex
        } else if (playMode === 'random') {
          // 随机播放：随机选择一首
          if (queue.length === 1) {
            nextIndex = 0
          } else {
            do {
              nextIndex = Math.floor(Math.random() * queue.length)
            } while (nextIndex === currentIndex)
          }
        } else {
          // 顺序播放 / 列表循环
          nextIndex = currentIndex + 1
          if (nextIndex >= queue.length) {
            nextIndex = 0 // 列表循环回到开头
          }
        }

        const nextMusic = queue[nextIndex]
        if (nextMusic) {
          get().play(nextMusic)
          // play 会更新 currentIndex，这里不需要手动设置
        }
      },

      // 上一首
      prev: () => {
        const { queue, currentIndex, currentTime } = get()
        if (queue.length === 0) return

        // 如果当前播放超过 3 秒，重新播放当前歌曲
        if (currentTime > 3) {
          if (audioElement) {
            audioElement.currentTime = 0
          }
          set({ currentTime: 0 })
          return
        }

        let prevIndex = currentIndex - 1
        if (prevIndex < 0) {
          prevIndex = queue.length - 1
        }

        const prevMusic = queue[prevIndex]
        if (prevMusic) {
          get().play(prevMusic)
        }
      },

      // 跳转到指定时间
      seek: (time: number) => {
        if (audioElement) {
          audioElement.currentTime = time
        }
        set({ currentTime: time })
      },

      // 设置音量
      setVolume: (v: number) => {
        const volume = Math.max(0, Math.min(1, v))
        if (audioElement) {
          audioElement.volume = volume
        }
        set({ volume })
      },

      // 设置播放速率
      setPlaybackRate: (rate: number) => {
        if (audioElement) {
          audioElement.playbackRate = rate
        }
        set({ playbackRate: rate })
      },

      // 设置播放模式
      setPlayMode: (mode: PlayMode) => {
        set({ playMode: mode })
      },

      // 更新当前播放时间（由 audio timeupdate 事件触发）
      setCurrentTime: (time: number) => {
        set({ currentTime: time })
      },

      // 更新总时长（由 audio loadedmetadata 事件触发）
      setDuration: (duration: number) => {
        set({ duration })
      },

      // 添加到播放列表
      addToQueue: (music: MusicItem) => {
        const { queue } = get()
        // 避免重复添加
        if (queue.some((m) => m.id === music.id)) return
        set({ queue: [...queue, music] })
      },

      // 从播放列表移除
      removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get()
        const newQueue = queue.filter((_, i) => i !== index)

        let newIndex = currentIndex
        if (index < currentIndex) {
          newIndex = currentIndex - 1
        } else if (index === currentIndex) {
          // 移除的是当前播放项
          if (newQueue.length === 0) {
            // 队列清空
            if (audioElement) {
              audioElement.pause()
              audioElement.src = ''
            }
            set({
              queue: [],
              currentIndex: -1,
              currentMusic: null,
              isPlaying: false,
              currentTime: 0,
              duration: 0,
            })
            return
          }
          // 播放下一首
          if (newIndex >= newQueue.length) {
            newIndex = 0
          }
          set({ queue: newQueue, currentIndex: newIndex })
          const nextMusic = newQueue[newIndex]
          if (nextMusic) {
            get().play(nextMusic)
          }
          return
        }

        set({ queue: newQueue, currentIndex: newIndex })
      },

      // 清空播放列表
      clearQueue: () => {
        if (audioElement) {
          audioElement.pause()
          audioElement.src = ''
        }
        set({
          queue: [],
          currentIndex: -1,
          currentMusic: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        })
      },

      // 切换播放列表抽屉
      togglePlaylist: () => {
        set((state) => ({ showPlaylist: !state.showPlaylist }))
      },

      // 按索引播放
      playByIndex: (index: number) => {
        const { queue } = get()
        if (index >= 0 && index < queue.length) {
          get().play(queue[index])
        }
      },
    }),
    {
      name: 'player-storage',
      // 只持久化需要恢复的状态
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentMusic: state.currentMusic,
        volume: state.volume,
        playMode: state.playMode,
        playbackRate: state.playbackRate,
      }),
    }
  )
)
