import { useState, useMemo } from 'react'

const BASE_XP   = 60
const STREAK_XP = 90
const HP_LOSS   = 20

function flattenQuestions(floor) {
  return floor.mobs.flatMap(mob =>
    mob.questions.map(q => ({ ...q, mobConcept: mob.concept }))
  )
}

function getMobForIndex(floor, qi) {
  let count = 0
  for (const mob of floor.mobs) {
    count += mob.questions.length
    if (qi < count) return mob
  }
  return floor.mobs[0]
}

export default function CombatScreen({ dungeon, floorIndex, onComplete }) {
  const floor = dungeon.floors[floorIndex]
  const questions = useMemo(() => flattenQuestions(floor), [floor])

  const [qi,       setQi]       = useState(0)
  const [hp,       setHp]       = useState(100)
  const [streak,   setStreak]   = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [correct,  setCorrect]  = useState(0)
  const [selected, setSelected] = useState(null)
  const [phase,    setPhase]    = useState('QUESTION')
  const [shakeHp,  setShakeHp]  = useState(false)

  const q   = questions[qi]
  const mob = getMobForIndex(floor, qi)
  const isBoss = !!floor.isBoss

  function handleAnswer(idx) {
    if (phase !== 'QUESTION' || selected !== null) return

    const isCorrect = idx === q.answer
    setSelected(idx)

    if (isCorrect) {
      const xp = streak >= 2 ? STREAK_XP : BASE_XP
      setXpGained(x => x + xp)
      setCorrect(c => c + 1)
      setStreak(s => s + 1)
    } else {
      setHp(h => Math.max(0, h - HP_LOSS))
      setStreak(0)
      setShakeHp(true)
      setTimeout(() => setShakeHp(false), 500)
    }

    setPhase('EXPLANATION')
  }

  function handleContinue() {
    const isLast = qi + 1 >= questions.length
    if (isLast) {
      onComplete({ correct, total: questions.length, xpGained, hp })
    } else {
      setQi(i => i + 1)
      setSelected(null)
      setPhase('QUESTION')
    }
  }

  const hpPct = hp
  const isCorrectAnswer = selected === q?.answer

  return (
    <div className="combat-page page">
      <div className="grid-bg" />

      {/* HUD */}
      <div className="combat-hud">
        <span className="hud-floor">{floor.title.toUpperCase()}</span>
        <span className="hud-progress">{qi + 1} / {questions.length}</span>
        <div className={`hud-hp-wrap ${shakeHp ? 'shake' : ''}`}>
          <span className="hud-label">HP</span>
          <div className="bar-track">
            <div className="bar-fill-hp" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="hud-hp-val">{hp}</span>
        </div>
        {streak >= 3 && (
          <span className="streak-badge">ARISE ×{streak}</span>
        )}
        {isBoss && (
          <span className="streak-badge" style={{ color: '#ff4466', borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.07)', boxShadow: '0 0 12px rgba(255,68,102,0.2)' }}>
            BOSS FLOOR
          </span>
        )}
      </div>

      {/* Mob name */}
      <div className="mob-banner">
        <span className="mob-tag">[ MOB ]</span>
        <span className="mob-name">{mob.concept}</span>
      </div>

      {/* Question */}
      <div className="question-panel">
        <p className="question-text">{q.prompt}</p>
      </div>

      {/* Choices */}
      <div className="choices-grid">
        {q.choices.map((choice, i) => {
          let cls = 'choice-btn'
          if (selected !== null) {
            if (i === q.answer)                      cls += ' choice-correct'
            else if (i === selected && !isCorrectAnswer) cls += ' choice-wrong'
            else                                     cls += ' choice-dim'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
              <span className="choice-text">{choice}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {phase === 'EXPLANATION' && (
        <div className={`explanation-panel ${isCorrectAnswer ? 'exp-correct' : 'exp-wrong'}`}>
          <div className="exp-verdict">
            {isCorrectAnswer ? '✓ CORRECT' : '✗ WRONG'}
            {isCorrectAnswer && streak >= 3 && ` — ARISE BONUS (+${STREAK_XP - BASE_XP} XP)`}
          </div>
          <p className="exp-text">{q.explanation}</p>
          <div className="exp-actions">
            <button className="sys-btn" onClick={handleContinue}>
              {qi + 1 >= questions.length ? '[ FLOOR CLEAR ]' : '[ CONTINUE ]'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
