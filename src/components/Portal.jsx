import { useState, useEffect } from 'react'

export default function Portal({ dungeons, loading, hunter, xpProgress, xpToNext, rankColors, onSelect, onReset }) {
  const [notif, setNotif] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setNotif(true), 600)
    return () => clearTimeout(t)
  }, [])

  const rankColor = rankColors[hunter.rank] || '#888'
  const accuracy = hunter.totalAnswered > 0
    ? Math.round((hunter.totalCorrect / hunter.totalAnswered) * 100)
    : 0

  return (
    <div className="portal-page page">
      <div className="grid-bg" />

      <div className="portal-topbar">
        {/* Hunter status */}
        <div className="hunter-card">
          <div className="hunter-rank" style={{ color: rankColor }}>{hunter.rank}</div>
          <div className="hunter-info">
            <div className="hunter-label">HUNTER STATUS</div>
            <div className="hunter-name">Solo Hunter</div>
            <div className="hunter-label" style={{ marginTop: 2 }}>
              {hunter.totalCorrect}/{hunter.totalAnswered} correct · {accuracy}% accuracy
            </div>
          </div>
          <div className="hunter-xp-wrap">
            <div className="xp-label">XP {hunter.xp}</div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="xp-next">
              {xpToNext != null ? `${xpToNext} xp to next rank` : 'MAX RANK'}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notif && (
          <div className="sys-notification">
            <span className="sys-bracket">[System] </span>
            Welcome back, Hunter. Dungeons await.
          </div>
        )}
      </div>

      <main>
        <p className="portal-title">
          <span className="sys-bracket">[</span>
          DUNGEON GATE
          <span className="sys-bracket">]</span>
        </p>

        {loading && (
          <p className="no-dungeons">Scanning for dungeon gates...</p>
        )}

        <div className="dungeon-grid">
          {!loading && dungeons.length === 0 && (
            <p className="no-dungeons">No dungeons detected in the vicinity.</p>
          )}
          {dungeons.map((d, i) => {
            const cleared = hunter.completedDungeons?.includes(d.id)
            const floorsCleared = (hunter.completedFloors?.[d.id] || []).length
            const dRankColor = rankColors[d.rank] || '#888'
            return (
              <button
                key={d.id}
                className={`dungeon-card ${cleared ? 'dungeon-cleared' : ''}`}
                onClick={() => onSelect(d)}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="dcard-rank" style={{ color: dRankColor }}>{d.rank}</div>
                <div className="dcard-body">
                  <div className="dcard-title">{d.title}</div>
                  <div className="dcard-meta">
                    {floorsCleared} / {d.floors.length} floors cleared
                  </div>
                </div>
                {cleared && <div className="dcard-badge">CLEARED</div>}
              </button>
            )
          })}
        </div>
      </main>

      {hunter.totalAnswered > 0 && (
        <button
          className="sys-btn sys-btn-sec"
          style={{ alignSelf: 'flex-end', marginTop: 'auto', fontSize: '0.65rem', padding: '6px 14px' }}
          onClick={() => { if (confirm('Reset all progress?')) onReset() }}
        >
          [ RESET DATA ]
        </button>
      )}
    </div>
  )
}
