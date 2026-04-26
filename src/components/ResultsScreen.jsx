import { useState, useEffect } from 'react'

function getGrade(correct, total) {
  const pct = total > 0 ? correct / total : 0
  if (pct >= 0.9) return { grade: 'S', color: '#ff3355', label: 'FLAWLESS' }
  if (pct >= 0.75) return { grade: 'A', color: '#ff9900', label: 'EXCELLENT' }
  if (pct >= 0.6)  return { grade: 'B', color: '#a855f7', label: 'GOOD' }
  if (pct >= 0.45) return { grade: 'C', color: '#4499ff', label: 'AVERAGE' }
  return                  { grade: 'D', color: '#666677', label: 'WEAK' }
}

export default function ResultsScreen({
  result, type, floorIndex, dungeon, hunter,
  onNext, onMap, onPortal,
}) {
  const [show, setShow] = useState(false)
  const { correct, total, xpGained, hp, multiplier } = result
  const { grade, color, label } = getGrade(correct, total)
  const floor = dungeon?.floors?.[floorIndex]

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="results-page page">
      <div className="grid-bg" />

      <div className={`results-panel ${show ? 'results-show' : ''}`}>
        <div className="results-header">
          {type === 'dungeon'
            ? `[ DUNGEON CLEARED — ${dungeon?.title} ]`
            : `[ FLOOR ${floorIndex + 1} CLEARED — ${floor?.title} ]`}
        </div>

        <div className="results-grade" style={{ color, textShadow: `0 0 30px ${color}` }}>
          {grade}
        </div>
        <div className="results-rank-label" style={{ color }}>{label}</div>

        <div className="results-stats">
          <div className="stat-row">
            <span>Correct Answers</span>
            <span style={{ color: '#00ffaa' }}>{correct} / {total}</span>
          </div>
          <div className="stat-row">
            <span>Accuracy</span>
            <span style={{ color: '#00ffaa' }}>
              {total > 0 ? Math.round((correct / total) * 100) : 0}%
            </span>
          </div>
          <div className="stat-row">
            <span>HP Remaining</span>
            <span style={{ color: hp > 60 ? '#00ffaa' : hp > 30 ? '#ff9900' : '#ff3355' }}>
              {hp} / 100
            </span>
          </div>
          <div className="stat-row">
            <span>XP Gained</span>
            <span style={{ color: '#ffd700' }}>+{xpGained} XP</span>
          </div>
          {multiplier != null && multiplier < 1.0 && (
            <div className="stat-row">
              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Replay penalty</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>×{multiplier}</span>
            </div>
          )}
          <div className="stat-row">
            <span>Hunter Rank</span>
            <span>{hunter.rank} ({hunter.xp} total XP)</span>
          </div>
        </div>

        <div className="results-actions">
          {type === 'floor' && (
            <>
              <button className="sys-btn" onClick={onNext}>[ NEXT FLOOR ]</button>
              <button className="sys-btn sys-btn-sec" onClick={onMap}>[ DUNGEON MAP ]</button>
            </>
          )}
          {type === 'dungeon' && (
            <button className="sys-btn" onClick={onPortal}>[ RETURN TO PORTAL ]</button>
          )}
        </div>
      </div>
    </div>
  )
}
