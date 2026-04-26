import { useState, useMemo, useRef, useEffect } from 'react'
import CodeEditor from './CodeEditor'
import workerCode from '../workers/runner.js?raw'

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
  const floor     = dungeon.floors[floorIndex]
  const questions = useMemo(() => flattenQuestions(floor), [floor])

  // Shared state
  const [qi,       setQi]       = useState(0)
  const [hp,       setHp]       = useState(100)
  const [streak,   setStreak]   = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [correct,  setCorrect]  = useState(0)
  const [shakeHp,  setShakeHp]  = useState(false)

  // MCQ state
  const [selected, setSelected] = useState(null)
  const [phase,    setPhase]    = useState('QUESTION')

  // Code question state
  const [codeValue,         setCodeValue]         = useState('')
  const [validateAttempts,  setValidateAttempts]  = useState(0)
  const [testResults,       setTestResults]       = useState(null)
  const [codePhase,         setCodePhase]         = useState('EDITING')
  const [codeSuccess,       setCodeSuccess]       = useState(false)
  const [workerBusy,        setWorkerBusy]        = useState(false)

  const workerRef     = useRef(null)
  const completionRef = useRef(null)

  const q      = questions[qi]
  const mob    = getMobForIndex(floor, qi)
  const isBoss = !!floor.isBoss
  const isCode = q?.type === 'code'

  // Create/teardown worker when question changes
  useEffect(() => {
    const curQ    = questions[qi]
    const isCodeQ = curQ?.type === 'code'

    setCodePhase('EDITING')
    setValidateAttempts(0)
    setTestResults(null)
    setCodeSuccess(false)
    setWorkerBusy(false)
    if (isCodeQ) setCodeValue(curQ.starterCode || '')

    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }

    let blobUrl = null
    if (isCodeQ) {
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      blobUrl = URL.createObjectURL(blob)
      workerRef.current = new Worker(blobUrl)
    }

    return () => {
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [qi]) // questions stable within a floor

  // ── MCQ handlers ─────────────────────────────────────────────────

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

  // ── Code handlers ─────────────────────────────────────────────────

  function runWorker(mode) {
    if (!workerRef.current || workerBusy) return
    setWorkerBusy(true)
    workerRef.current.onmessage = ({ data }) => {
      setWorkerBusy(false)
      if (data.error) { setTestResults({ error: data.error }); return }
      if (data.mode === 'test') {
        setTestResults({ mode: 'test', results: data.results })
      } else {
        handleValidateResult(data.results)
      }
    }
    workerRef.current.postMessage({ code: codeValue, tests: q.testSuite, mode })
  }

  function handleValidateResult(results) {
    const allPassed = results.every(r => r.passed)
    const attempt   = validateAttempts + 1

    if (allPassed) {
      const baseXP    = streak >= 2 ? STREAK_XP : BASE_XP
      const xpDelta   = attempt === 1 ? baseXP
                      : attempt === 2 ? Math.round(baseXP * 0.75)
                      :                 Math.round(baseXP * 0.25)
      const newStreak  = attempt === 1 ? streak + 1 : 0
      const newXP      = xpGained + xpDelta
      const newCorrect = correct + 1

      setXpGained(newXP)
      setCorrect(newCorrect)
      setStreak(newStreak)
      setTestResults({ mode: 'validate', results })
      setCodeSuccess(true)
      completionRef.current = { xpGained: newXP, correct: newCorrect, hp }
      setCodePhase('DONE')
    } else if (attempt >= 3) {
      const newHp = Math.max(0, hp - HP_LOSS)
      setHp(newHp)
      setShakeHp(true)
      setTimeout(() => setShakeHp(false), 500)
      setTestResults({ mode: 'validate', results })
      setCodeSuccess(false)
      completionRef.current = { xpGained, correct, hp: newHp }
      setCodePhase('DONE')
    } else {
      setValidateAttempts(attempt)
      setTestResults({ mode: 'validate', results })
    }
  }

  function handleCodeContinue() {
    const data   = completionRef.current
    if (!data) return
    const isLast = qi + 1 >= questions.length
    if (isLast) {
      onComplete({ correct: data.correct, total: questions.length, xpGained: data.xpGained, hp: data.hp })
    } else {
      setQi(i => i + 1)
      setSelected(null)
      setPhase('QUESTION')
    }
  }

  // ── Shared JSX fragments ──────────────────────────────────────────

  const hpPct = hp

  const Hud = (
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
      {streak >= 3 && <span className="streak-badge">ARISE ×{streak}</span>}
      {isBoss && (
        <span className="streak-badge" style={{ color: '#ff4466', borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.07)', boxShadow: '0 0 12px rgba(255,68,102,0.2)' }}>
          BOSS FLOOR
        </span>
      )}
    </div>
  )

  const MobBanner = (
    <div className="mob-banner">
      <span className="mob-tag">[ MOB ]</span>
      <span className="mob-name">{mob.concept}</span>
    </div>
  )

  // ── Code question render ──────────────────────────────────────────

  if (isCode) {
    return (
      <div className="combat-page page">
        <div className="grid-bg" />
        {Hud}
        {MobBanner}

        <div className="question-panel">
          <p className="question-text">{q.prompt}</p>
        </div>

        {codePhase !== 'DONE' && (
          <>
            <div className="code-editor-wrap">
              <CodeEditor
                language={q.language || 'javascript'}
                defaultValue={q.starterCode || ''}
                onChange={setCodeValue}
              />
            </div>

            <div className="code-actions">
              <button className="sys-btn" onClick={() => runWorker('test')} disabled={workerBusy}>
                {workerBusy ? '[ RUNNING... ]' : '[ TEST ]'}
              </button>
              <button
                className="sys-btn"
                onClick={() => runWorker('validate')}
                disabled={workerBusy || validateAttempts >= 3}
              >
                {workerBusy ? '[ RUNNING... ]' : '[ VALIDATE ]'}
              </button>
              <span className="code-attempts">Validate {validateAttempts} / 3</span>
            </div>

            {testResults && (
              <div className="code-results-panel">
                {testResults.error && (
                  <div className="code-result-error">{testResults.error}</div>
                )}
                {testResults.results?.map((r, i) => (
                  <div
                    key={i}
                    className={`code-result-row ${
                      testResults.mode === 'validate'
                        ? r.passed ? 'code-result-pass' : 'code-result-fail'
                        : ''
                    }`}
                  >
                    <span className="code-result-icon">
                      {testResults.mode === 'validate' ? (r.passed ? '✓' : '✗') : '›'}
                    </span>
                    <span className="code-result-desc">{r.description}</span>
                    <span className="code-result-got">
                      {r.error ? `error: ${r.error}` : `→ ${JSON.stringify(r.got)}`}
                    </span>
                    {testResults.mode === 'validate' && !r.passed && !r.error && (
                      <span className="code-result-expected">
                        expected: {JSON.stringify(r.expected)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {codePhase === 'DONE' && (
          <div className={`explanation-panel ${codeSuccess ? 'exp-correct' : 'exp-wrong'}`}>
            <div className="exp-verdict">
              {codeSuccess ? '✓ ALL TESTS PASSED' : '✗ VALIDATION FAILED'}
            </div>
            {testResults?.results && (
              <div className="code-results-inline">
                {testResults.results.map((r, i) => (
                  <div key={i} className={`code-result-row ${r.passed ? 'code-result-pass' : 'code-result-fail'}`}>
                    <span className="code-result-icon">{r.passed ? '✓' : '✗'}</span>
                    <span className="code-result-desc">{r.description}</span>
                    {!r.passed && (
                      <span className="code-result-expected">
                        {r.error
                          ? `error: ${r.error}`
                          : `got ${JSON.stringify(r.got)}, expected ${JSON.stringify(r.expected)}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="exp-text">{q.explanation}</p>
            <div className="exp-actions">
              <button className="sys-btn" onClick={handleCodeContinue}>
                {qi + 1 >= questions.length ? '[ FLOOR CLEAR ]' : '[ CONTINUE ]'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── MCQ render ────────────────────────────────────────────────────

  const isCorrectMCQ = selected === q?.answer

  return (
    <div className="combat-page page">
      <div className="grid-bg" />
      {Hud}
      {MobBanner}

      <div className="question-panel">
        <p className="question-text">{q.prompt}</p>
      </div>

      <div className="choices-grid">
        {q.choices.map((choice, i) => {
          let cls = 'choice-btn'
          if (selected !== null) {
            if (i === q.answer)                        cls += ' choice-correct'
            else if (i === selected && !isCorrectMCQ)  cls += ' choice-wrong'
            else                                       cls += ' choice-dim'
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

      {phase === 'EXPLANATION' && (
        <div className={`explanation-panel ${isCorrectMCQ ? 'exp-correct' : 'exp-wrong'}`}>
          <div className="exp-verdict">
            {isCorrectMCQ ? '✓ CORRECT' : '✗ WRONG'}
            {isCorrectMCQ && streak >= 3 && ` — ARISE BONUS (+${STREAK_XP - BASE_XP} XP)`}
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
