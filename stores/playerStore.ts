import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Music } from "@/types/music";

interface PlayerState {
  // 当前播放
  currentMusic: Music | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;

  // 播放队列
  queue: Music[];
  currentIndex: number;

  // 播放模式
  playMode: "list" | "single" | "random";

  // 操作
  play: (music: Music, queue?: Music[]) => void;
  togglePlay: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (rate: number) => void;
  addToQueue: (music: Music) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setPlayMode: (mode: "list" | "single" | "random") => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentMusic: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 80,
      playbackRate: 1,
      queue: [],
      currentIndex: -1,
      playMode: "list",

      // 播放指定音乐
      play: (music, queue) => {
        if (queue) {
          const index = queue.findIndex((m) => m.id === music.id);
          set({
            currentMusic: music,
            isPlaying: true,
            currentTime: 0,
            queue,
            currentIndex: index >= 0 ? index : 0,
          });
        } else {
          const { queue: currentQueue } = get();
          const index = currentQueue.findIndex((m) => m.id === music.id);
          if (index >= 0) {
            set({
              currentMusic: music,
              isPlaying: true,
              currentTime: 0,
              currentIndex: index,
            });
          } else {
            set({
              currentMusic: music,
              isPlaying: true,
              currentTime: 0,
              queue: [...currentQueue, music],
              currentIndex: currentQueue.length,
            });
          }
        }
      },

      // 切换播放/暂停
      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      // 暂停
      pause: () => {
        set({ isPlaying: false });
      },

      // 下一首
      next: () => {
        const { queue, currentIndex, playMode } = get();
        if (queue.length === 0) return;

        let nextIndex: number;
        if (playMode === "random") {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else if (playMode === "single") {
          nextIndex = currentIndex;
        } else {
          nextIndex = (currentIndex + 1) % queue.length;
        }

        set({
          currentMusic: queue[nextIndex],
          currentIndex: nextIndex,
          currentTime: 0,
          isPlaying: true,
        });
      },

      // 上一首
      prev: () => {
        const { queue, currentIndex, playMode } = get();
        if (queue.length === 0) return;

        let prevIndex: number;
        if (playMode === "random") {
          prevIndex = Math.floor(Math.random() * queue.length);
        } else if (playMode === "single") {
          prevIndex = currentIndex;
        } else {
          prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        }

        set({
          currentMusic: queue[prevIndex],
          currentIndex: prevIndex,
          currentTime: 0,
          isPlaying: true,
        });
      },

      // 跳转到指定时间
      seek: (time) => {
        set({ currentTime: time });
      },

      // 设置音量
      setVolume: (v) => {
        set({ volume: Math.max(0, Math.min(100, v)) });
      },

      // 设置播放速率
      setPlaybackRate: (rate) => {
        set({ playbackRate: rate });
      },

      // 添加到播放队列
      addToQueue: (music) => {
        set((state) => ({
          queue: [...state.queue, music],
        }));
      },

      // 从队列移除
      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = [...state.queue];
          newQueue.splice(index, 1);
          const newIndex =
            state.currentIndex > index
              ? state.currentIndex - 1
              : state.currentIndex;
          return {
            queue: newQueue,
            currentIndex: Math.min(newIndex, newQueue.length - 1),
          };
        });
      },

      // 重新排序队列
      reorderQueue: (from, to) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(from, 1);
          newQueue.splice(to, 0, removed);
          let newIndex = state.currentIndex;
          if (state.currentIndex === from) {
            newIndex = to;
          } else if (
            from < state.currentIndex &&
            to >= state.currentIndex
          ) {
            newIndex--;
          } else if (
            from > state.currentIndex &&
            to <= state.currentIndex
          ) {
            newIndex++;
          }
          return { queue: newQueue, currentIndex: newIndex };
        });
      },

      // 清空队列
      clearQueue: () => {
        set({
          queue: [],
          currentIndex: -1,
          currentMusic: null,
          isPlaying: false,
        });
      },

      // 设置播放模式
      setPlayMode: (mode) => {
        set({ playMode: mode });
      },
    }),
    {
      name: "player-storage",
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        playMode: state.playMode,
        queue: state.queue,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
