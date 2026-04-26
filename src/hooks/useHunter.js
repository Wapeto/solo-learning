import { useState, useEffect } from 'react'

export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']
export const XP_THRESHOLDS = [0, 300, 800, 1800, 3500, 6000, 10000, 16000]

const RANK_COLORS = {
  E: '#666677', D: '#44aa44', C: '#4499ff',
  B: '#a855f7', A: '#ff9900', S: '#ff3355', SS: '#ff3355', SSS: '#ff3355',
}

function computeRank(xp) {
  let idx = 0
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) { idx = i; break }
  }
  return { rank: RANKS[idx], rankIndex: idx }
}

const DEFAULT_HUNTER = {
  xp: 0,
  rank: 'E',
  rankIndex: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  completedFloors: {},
  completedDungeons: [],
}

export function useHunter() {
  const [hunter, setHunter] = useState(() => {
    try {
      const saved = localStorage.getItem('sl_hunter')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_HUNTER
  })

  useEffect(() => {
    localStorage.setItem('sl_hunter', JSON.stringify(hunter))
  }, [hunter])

  function gainXP(amount) {
    setHunter(h => {
      const newXP = h.xp + amount
      const { rank, rankIndex } = computeRank(newXP)
      return { ...h, xp: newXP, rank, rankIndex }
    })
  }

  function recordAnswer(correct) {
    setHunter(h => ({
      ...h,
      totalCorrect: h.totalCorrect + (correct ? 1 : 0),
      totalAnswered: h.totalAnswered + 1,
    }))
  }

  function completeFloor(dungeonId, floorIndex) {
    setHunter(h => {
      const prev = h.completedFloors[dungeonId] || []
      if (prev.includes(floorIndex)) return h
      return {
        ...h,
        completedFloors: { ...h.completedFloors, [dungeonId]: [...prev, floorIndex] },
      }
    })
  }

  function completeDungeon(dungeonId) {
    setHunter(h => ({
      ...h,
      completedDungeons: h.completedDungeons.includes(dungeonId)
        ? h.completedDungeons
        : [...h.completedDungeons, dungeonId],
    }))
  }

  function getXPProgress() {
    const { rankIndex, xp } = hunter
    if (rankIndex >= XP_THRESHOLDS.length - 1) return 100
    const current = XP_THRESHOLDS[rankIndex]
    const next = XP_THRESHOLDS[rankIndex + 1]
    return Math.round(((xp - current) / (next - current)) * 100)
  }

  function getXPToNext() {
    const { rankIndex, xp } = hunter
    if (rankIndex >= XP_THRESHOLDS.length - 1) return null
    return XP_THRESHOLDS[rankIndex + 1] - xp
  }

  function reset() {
    setHunter(DEFAULT_HUNTER)
    localStorage.removeItem('sl_hunter')
  }

  return {
    hunter,
    gainXP,
    recordAnswer,
    completeFloor,
    completeDungeon,
    getXPProgress,
    getXPToNext,
    reset,
    RANK_COLORS,
  }
}
