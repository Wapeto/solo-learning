import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']
export const XP_THRESHOLDS = [0, 600, 1600, 3600, 7000, 12000, 20000, 32000]

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
  floorClearCount: {},
}

function toRow(h, userId) {
  return {
    user_id: userId,
    xp: h.xp,
    rank: h.rank,
    rank_index: h.rankIndex,
    total_correct: h.totalCorrect,
    total_answered: h.totalAnswered,
    completed_floors: h.completedFloors,
    completed_dungeons: h.completedDungeons,
    floor_clear_count: h.floorClearCount,
    updated_at: new Date().toISOString(),
  }
}

function fromRow(row) {
  return {
    xp: row.xp,
    rank: row.rank,
    rankIndex: row.rank_index,
    totalCorrect: row.total_correct,
    totalAnswered: row.total_answered,
    completedFloors: row.completed_floors ?? {},
    completedDungeons: row.completed_dungeons ?? [],
    floorClearCount: row.floor_clear_count ?? {},
  }
}

function upsert(h, userId) {
  supabase
    .from('hunter_state')
    .upsert(toRow(h, userId), { onConflict: 'user_id' })
    .then(({ error }) => { if (error) console.error(error) })
}

export function useHunter(userId) {
  const [hunter, setHunter] = useState(DEFAULT_HUNTER)
  const hasMutated = useRef(false)

  useEffect(() => {
    if (!userId) return
    hasMutated.current = false
    supabase
      .from('hunter_state')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (hasMutated.current) return
        if (data) {
          setHunter(fromRow(data))
        } else {
          upsert(DEFAULT_HUNTER, userId)
        }
      })
  }, [userId])

  function gainXP(amount) {
    hasMutated.current = true
    setHunter(h => {
      const newXP = h.xp + amount
      const { rank, rankIndex } = computeRank(newXP)
      const next = { ...h, xp: newXP, rank, rankIndex }
      if (userId) upsert(next, userId)
      return next
    })
  }

  function recordAnswer(correct) {
    hasMutated.current = true
    setHunter(h => {
      const next = {
        ...h,
        totalCorrect: h.totalCorrect + (correct ? 1 : 0),
        totalAnswered: h.totalAnswered + 1,
      }
      if (userId) upsert(next, userId)
      return next
    })
  }

  function completeFloor(dungeonId, floorIndex) {
    hasMutated.current = true
    setHunter(h => {
      const key = `${dungeonId}_${floorIndex}`
      const prev = h.completedFloors[dungeonId] || []
      const next = {
        ...h,
        completedFloors: prev.includes(floorIndex)
          ? h.completedFloors
          : { ...h.completedFloors, [dungeonId]: [...prev, floorIndex] },
        floorClearCount: {
          ...h.floorClearCount,
          [key]: (h.floorClearCount[key] || 0) + 1,
        },
      }
      if (userId) upsert(next, userId)
      return next
    })
  }

  function getReplayMultiplier(dungeonId, floorIndex) {
    const key = `${dungeonId}_${floorIndex}`
    const count = hunter.floorClearCount[key] || 0
    if (count === 0) return 1.0
    if (count === 1) return 0.5
    if (count === 2) return 0.25
    return 0.1
  }

  function completeDungeon(dungeonId) {
    hasMutated.current = true
    setHunter(h => {
      if (h.completedDungeons.includes(dungeonId)) return h
      const next = {
        ...h,
        completedDungeons: [...h.completedDungeons, dungeonId],
      }
      if (userId) upsert(next, userId)
      return next
    })
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

  function giveUp() {
    hasMutated.current = true
    setHunter(h => {
      const newXP = Math.max(0, h.xp - 50)
      const { rank, rankIndex } = computeRank(newXP)
      const next = { ...h, xp: newXP, rank, rankIndex }
      if (userId) upsert(next, userId)
      return next
    })
  }

  function reset() {
    hasMutated.current = true
    setHunter(DEFAULT_HUNTER)
    if (userId) upsert(DEFAULT_HUNTER, userId)
  }

  return {
    hunter,
    gainXP,
    recordAnswer,
    completeFloor,
    completeDungeon,
    getXPProgress,
    getXPToNext,
    getReplayMultiplier,
    giveUp,
    reset,
    RANK_COLORS,
  }
}
