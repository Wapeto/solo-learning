import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const RANK_COLORS = {
  E: '#888', D: '#44cc77', C: '#44aaff', B: '#aa66ff',
  A: '#ff9900', S: '#ff4466', SS: '#ff0033', SSS: '#cc0022',
}

export default function DungeonPreview({ supabaseId, user, userDungeons, onImport, fetchPublicDungeon, onPortal }) {
  const [dungeon, setDungeon] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)

  useEffect(() => {
    setFetchLoading(true)
    setNotFound(false)
    fetchPublicDungeon(supabaseId).then(data => {
      if (!data) setNotFound(true)
      else setDungeon(data)
      setFetchLoading(false)
    })
  }, [supabaseId])

  const alreadyImported = userDungeons.some(d => d._supabaseId === supabaseId)
  const totalQuestions = dungeon
    ? dungeon.floors.reduce((acc, f) => acc + f.mobs.reduce((a, m) => a + m.questions.length, 0), 0)
    : 0

  async function handleImport() {
    setImporting(true)
    setImportError(null)
    try {
      await onImport(supabaseId)
      onPortal()
    } catch (err) {
      setImportError(err.message)
      setImporting(false)
    }
  }

  function handleLoginToImport() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
  }

  if (fetchLoading) {
    return (
      <div className="preview-page page">
        <div className="grid-bg" />
        <div className="preview-center">
          <p className="preview-status">[ LOADING GATE... ]</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="preview-page page">
        <div className="grid-bg" />
        <div className="preview-center">
          <p className="preview-status preview-status-error">[ GATE NOT FOUND ]</p>
          <button className="sys-btn" style={{ marginTop: 24 }} onClick={onPortal}>
            [ GO TO PORTAL ]
          </button>
        </div>
      </div>
    )
  }

  const rankColor = RANK_COLORS[dungeon.rank] || '#888'

  return (
    <div className="preview-page page">
      <div className="grid-bg" />

      <button className="back-btn" onClick={onPortal}>← PORTAL</button>

      <div className="preview-header">
        <div className="map-rank" style={{ color: rankColor }}>RANK {dungeon.rank} DUNGEON</div>
        <h1 className="map-title">{dungeon.title}</h1>
        {dungeon.description && <p className="map-desc">{dungeon.description}</p>}
        <div className="preview-stats">
          <span>{dungeon.floors.length} floor{dungeon.floors.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="floor-list">
        {dungeon.floors.map((floor, i) => {
          const isBoss = !!floor.isBoss
          const qCount = floor.mobs.reduce((acc, m) => acc + m.questions.length, 0)
          return (
            <div
              key={i}
              className={['floor-item floor-preview', isBoss ? 'floor-boss' : ''].join(' ')}
              style={{ cursor: 'default' }}
            >
              <div className="floor-num">F{i + 1}</div>
              <div className="floor-info">
                <div className="floor-name">{floor.title}</div>
                <div className="floor-mobs">{qCount} question{qCount !== 1 ? 's' : ''} · {floor.mobs.length} mob{floor.mobs.length !== 1 ? 's' : ''}</div>
              </div>
              {isBoss && <div className="floor-status" style={{ color: '#ff4466' }}>BOSS</div>}
            </div>
          )
        })}
      </div>

      <div className="preview-action">
        {importError && <p style={{ color: 'var(--fail)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: 12 }}>{importError}</p>}
        {!user && (
          <button className="sys-btn" onClick={handleLoginToImport}>
            [ LOGIN TO IMPORT ]
          </button>
        )}
        {user && alreadyImported && (
          <button className="sys-btn" disabled style={{ opacity: 0.5 }}>
            [ ALREADY IN PORTAL ]
          </button>
        )}
        {user && !alreadyImported && (
          <button className="sys-btn" onClick={handleImport} disabled={importing}>
            {importing ? '[ IMPORTING... ]' : '[ ADD TO MY PORTAL ]'}
          </button>
        )}
      </div>
    </div>
  )
}
