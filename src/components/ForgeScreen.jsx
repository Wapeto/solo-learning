import { useState, useRef } from 'react'

const PROMPT_TEMPLATE = `You are a dungeon generator for a gamified learning app called Solo Learning.
Your output must be a single valid JSON object and nothing else — no markdown, no backticks, no explanation.

Generate a dungeon from the course material I will provide.

Follow this exact schema:
{
  "id": "unique-lowercase-kebab-id",
  "title": "Dungeon Title",
  "description": "One sentence description.",
  "rank": "B",
  "floors": [
    {
      "title": "Floor Title",
      "mobs": [
        {
          "concept": "Concept Name",
          "lore": "One sentence flavor text about this concept.",
          "questions": [
            {
              "prompt": "The question text. Supports **bold**, \`inline code\`, and \`\`\`\\ncode blocks\\n\`\`\`.",
              "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
              "answer": 0,
              "explanation": "Why the correct answer is correct."
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- rank must be one of: E, D, C, B, A, S
- Each floor must have 1-3 mobs
- Each mob must have 2-5 questions
- Each question must have exactly 4 choices
- answer is the zero-based index of the correct choice
- The last floor must have isBoss: true and contain the hardest questions
- Questions must test understanding, not just memorization
- Vary question difficulty across floors (easy → hard → boss)
- The id must be unique, lowercase, and use hyphens not spaces
- Output only the JSON object. No other text.

Here is the course material:
[PASTE YOUR COURSE MATERIAL HERE]`

function sanitizeDungeonText(raw) {
  return raw
    .replace(/^```[a-z]*\n?/gm, '')
    .replace(/^```$/gm, '')
    .replace(/\[cite[^\]]*\]/g, '')
    .replace(/\[cite_start\]/g, '')
    .replace(/\[\^?\d+\]/g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1')
    .trim()
}

export default function ForgeScreen({ userId, userDungeons, uploadDungeon, deleteDungeon, getShareUrl, onBack }) {
  const [copyLabel, setCopyLabel] = useState('[ COPY PROMPT ]')
  const [uploadStatus, setUploadStatus] = useState(null) // { type: 'success'|'error', message, shareUrl?, supabaseId? }
  const [shareCopied, setShareCopied] = useState({})
  const [dragging, setDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteStatus, setPasteStatus] = useState(null) // { type: 'success'|'error', message, shareUrl?, supabaseId? }
  const [pasteCopied, setPasteCopied] = useState(false)
  const fileInputRef = useRef(null)

  function handleCopyPrompt() {
    navigator.clipboard.writeText(PROMPT_TEMPLATE).then(() => {
      setCopyLabel('[ COPIED ]')
      setTimeout(() => setCopyLabel('[ COPY PROMPT ]'), 2000)
    })
  }

  async function handleFile(file) {
    setUploadStatus(null)
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const id = await uploadDungeon(json)
      setUploadStatus({
        type: 'success',
        message: `[ DUNGEON GATE OPENED — ${json.title} ]`,
        shareUrl: getShareUrl(id),
        supabaseId: id,
      })
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message })
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  async function handlePasteUpload() {
    setPasteStatus(null)
    const sanitized = sanitizeDungeonText(pasteText)
    let json
    try {
      json = JSON.parse(sanitized)
    } catch (err) {
      setPasteStatus({ type: 'error', message: `[ INVALID JSON ] — check for syntax errors and try again` })
      return
    }
    try {
      const id = await uploadDungeon(json)
      setPasteStatus({
        type: 'success',
        message: `[ DUNGEON GATE OPENED — ${json.title} ]`,
        shareUrl: getShareUrl(id),
        supabaseId: id,
      })
      setPasteText('')
    } catch (err) {
      setPasteStatus({ type: 'error', message: err.message })
    }
  }

  function copyShareUrl(supabaseId, url) {
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(prev => ({ ...prev, [supabaseId]: true }))
      setTimeout(() => setShareCopied(prev => ({ ...prev, [supabaseId]: false })), 2000)
    })
  }

  return (
    <div className="forge-page page">
      <div className="grid-bg" />

      <button className="back-btn" onClick={onBack}>← PORTAL</button>

      <p className="portal-title">
        <span className="sys-bracket">[</span>
        DUNGEON FORGE
        <span className="sys-bracket">]</span>
      </p>

      {/* Section 1: AI Prompt Template */}
      <div className="forge-section">
        <div className="sys-notification" style={{ marginBottom: 16 }}>
          <span className="sys-bracket">[System] </span>
          Generate dungeons from any course material using AI
        </div>

        <div className="forge-template-box">
          <pre className="forge-template-text">{PROMPT_TEMPLATE}</pre>
        </div>

        <div className="forge-copy-row">
          <button className="sys-btn" onClick={handleCopyPrompt}>{copyLabel}</button>
          <span className="forge-hint">
            Paste your course material at the bottom, then send to any AI (ChatGPT, Claude, Gemini...)
          </span>
        </div>
      </div>

      {/* Section 2: JSON Paste */}
      <div className="forge-section">
        <div className="sys-notification" style={{ marginBottom: 16 }}>
          <span className="sys-bracket">[System] </span>
          PASTE DUNGEON JSON
        </div>

        <textarea
          className="forge-paste-area"
          placeholder="Or paste your dungeon JSON here..."
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
        />

        <div className="forge-copy-row" style={{ marginTop: 12 }}>
          <button className="sys-btn" onClick={handlePasteUpload}>[ PARSE &amp; UPLOAD ]</button>
        </div>

        {pasteStatus && (
          <div className={`forge-upload-result forge-upload-result-${pasteStatus.type}`}>
            <div>{pasteStatus.message}</div>
            {pasteStatus.type === 'success' && pasteStatus.shareUrl && (
              <div className="forge-share-row">
                <span className="forge-share-url">{pasteStatus.shareUrl}</span>
                <button
                  className="sys-btn"
                  style={{ fontSize: '0.7rem', padding: '4px 14px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(pasteStatus.shareUrl).then(() => {
                      setPasteCopied(true)
                      setTimeout(() => setPasteCopied(false), 2000)
                    })
                  }}
                >
                  {pasteCopied ? '[ COPIED ]' : '[ COPY LINK ]'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Drop Zone */}
      <div className="forge-section">
        <div className="sys-notification" style={{ marginBottom: 16 }}>
          <span className="sys-bracket">[System] </span>
          UPLOAD DUNGEON
        </div>

        <div
          className={`forge-dropzone${dragging ? ' forge-dropzone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="forge-drop-text">Drop your dungeon JSON here, or click to browse</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>

        {uploadStatus && (
          <div className={`forge-upload-result forge-upload-result-${uploadStatus.type}`}>
            <div>{uploadStatus.message}</div>
            {uploadStatus.type === 'success' && uploadStatus.shareUrl && (
              <div className="forge-share-row">
                <span className="forge-share-url">{uploadStatus.shareUrl}</span>
                <button
                  className="sys-btn"
                  style={{ fontSize: '0.7rem', padding: '4px 14px' }}
                  onClick={() => copyShareUrl(uploadStatus.supabaseId, uploadStatus.shareUrl)}
                >
                  {shareCopied[uploadStatus.supabaseId] ? '[ COPIED ]' : '[ COPY LINK ]'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: My Dungeons */}
      <div className="forge-section">
        <div className="sys-notification" style={{ marginBottom: 16 }}>
          <span className="sys-bracket">[System] </span>
          MY FORGED DUNGEONS
        </div>

        {userDungeons.length === 0 ? (
          <p className="no-dungeons">No forged dungeons yet.</p>
        ) : (
          <div className="forge-dungeon-list">
            {userDungeons.map(d => {
              const shareUrl = getShareUrl(d._supabaseId)
              return (
                <div key={d._supabaseId} className="forge-dungeon-item">
                  <div className="forge-dungeon-rank">{d.rank}</div>
                  <div className="forge-dungeon-info">
                    <div className="forge-dungeon-title">{d.title}</div>
                    <div className="forge-dungeon-meta">
                      {d.floors?.length ?? 0} floor{(d.floors?.length ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="forge-dungeon-actions">
                    <button
                      className="sys-btn sys-btn-sec"
                      style={{ fontSize: '0.65rem', padding: '4px 12px' }}
                      onClick={() => copyShareUrl(d._supabaseId, shareUrl)}
                    >
                      {shareCopied[d._supabaseId] ? '[ COPIED ]' : '[ SHARE ]'}
                    </button>
                    <button
                      className="sys-btn sys-btn-sec"
                      style={{ fontSize: '0.65rem', padding: '4px 12px', color: 'var(--fail)', borderColor: 'var(--fail)' }}
                      onClick={async () => {
                        if (confirm(`Delete "${d.title}"?`)) {
                          try { await deleteDungeon(d._supabaseId) }
                          catch (err) { alert(err.message) }
                        }
                      }}
                    >
                      [ DELETE ]
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
