export default function DungeonMap({ dungeon, hunter, rankColors, onSelectFloor, onBack }) {
  const completedFloors = hunter.completedFloors?.[dungeon.id] || []
  const dRankColor = rankColors[dungeon.rank] || '#888'

  return (
    <div className="map-page page">
      <div className="grid-bg" />

      <button className="back-btn" onClick={onBack}>← PORTAL</button>

      <div className="map-header">
        <div className="map-rank" style={{ color: dRankColor }}>
          RANK {dungeon.rank} DUNGEON
        </div>
        <h1 className="map-title">{dungeon.title}</h1>
        {dungeon.description && (
          <p className="map-desc">{dungeon.description}</p>
        )}
      </div>

      <div className="floor-list">
        {dungeon.floors.map((floor, i) => {
          const cleared = completedFloors.includes(i)
          const locked = i > 0 && !completedFloors.includes(i - 1) && !cleared
          const isBoss = !!floor.isBoss
          const qCount = floor.mobs.reduce((acc, m) => acc + m.questions.length, 0)

          let statusText = '► ENTER'
          if (cleared) statusText = '✓ CLEARED'
          if (locked)  statusText = '🔒 LOCKED'

          return (
            <button
              key={i}
              className={[
                'floor-item',
                cleared ? 'floor-cleared' : '',
                locked  ? 'floor-locked'  : '',
                isBoss  ? 'floor-boss'    : '',
              ].join(' ')}
              onClick={() => !locked && onSelectFloor(i)}
              disabled={locked}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="floor-num">F{i + 1}</div>
              <div className="floor-info">
                <div className="floor-name">{floor.title}</div>
                <div className="floor-mobs">{qCount} questions · {floor.mobs.length} mob{floor.mobs.length > 1 ? 's' : ''}</div>
              </div>
              <div className="floor-status">{statusText}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
