import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useHunter } from './hooks/useHunter'
import Portal from './components/Portal'
import DungeonMap from './components/DungeonMap'
import CombatScreen from './components/CombatScreen'
import ResultsScreen from './components/ResultsScreen'
import LoginScreen from './components/LoginScreen'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const [screen, setScreen] = useState('PORTAL')
  const [dungeons, setDungeons] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDungeon, setCurrentDungeon] = useState(null)
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0)
  const [lastResult, setLastResult] = useState(null)

  const ctx = useHunter(user?.id ?? null)

  useEffect(() => {
    fetch(`${BASE}dungeons/index.json`)
      .then(r => r.json())
      .then(ids => Promise.all(ids.map(id => fetch(`${BASE}dungeons/${id}.json`).then(r => r.json()))))
      .then(data => { setDungeons(data); setLoading(false) })
      .catch(() => { setDungeons([]); setLoading(false) })
  }, [])

  function enterDungeon(dungeon) {
    setCurrentDungeon(dungeon)
    setCurrentFloorIndex(0)
    setScreen('DUNGEON_MAP')
  }

  function enterFloor(idx) {
    setCurrentFloorIndex(idx)
    setScreen('COMBAT')
  }

  function handleFloorComplete(result) {
    ctx.gainXP(result.xpGained)
    ctx.recordAnswer(result.correct > 0)
    ctx.completeFloor(currentDungeon.id, currentFloorIndex)
    setLastResult(result)

    const isLast = currentFloorIndex >= currentDungeon.floors.length - 1
    if (isLast) {
      ctx.completeDungeon(currentDungeon.id)
      setScreen('DUNGEON_RESULTS')
    } else {
      setScreen('FLOOR_RESULTS')
    }
  }

  function goNextFloor() {
    setCurrentFloorIndex(i => i + 1)
    setScreen('COMBAT')
  }

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#05050e',
        fontFamily: 'Rajdhani, sans-serif',
        color: '#4466ff',
        fontSize: '1rem',
        letterSpacing: '0.2em',
      }}>
        [ SYSTEM INITIALIZING... ]
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} />
  }

  return (
    <>
      {screen === 'PORTAL' && (
        <Portal
          dungeons={dungeons}
          loading={loading}
          hunter={ctx.hunter}
          xpProgress={ctx.getXPProgress()}
          xpToNext={ctx.getXPToNext()}
          rankColors={ctx.RANK_COLORS}
          onSelect={enterDungeon}
          onReset={ctx.reset}
          onSignOut={signOut}
        />
      )}
      {screen === 'DUNGEON_MAP' && currentDungeon && (
        <DungeonMap
          dungeon={currentDungeon}
          hunter={ctx.hunter}
          rankColors={ctx.RANK_COLORS}
          onSelectFloor={enterFloor}
          onBack={() => setScreen('PORTAL')}
        />
      )}
      {screen === 'COMBAT' && currentDungeon && (
        <CombatScreen
          dungeon={currentDungeon}
          floorIndex={currentFloorIndex}
          onComplete={handleFloorComplete}
        />
      )}
      {(screen === 'FLOOR_RESULTS' || screen === 'DUNGEON_RESULTS') && lastResult && (
        <ResultsScreen
          result={lastResult}
          type={screen === 'DUNGEON_RESULTS' ? 'dungeon' : 'floor'}
          floorIndex={currentFloorIndex}
          dungeon={currentDungeon}
          hunter={ctx.hunter}
          onNext={goNextFloor}
          onMap={() => setScreen('DUNGEON_MAP')}
          onPortal={() => setScreen('PORTAL')}
        />
      )}
    </>
  )
}
