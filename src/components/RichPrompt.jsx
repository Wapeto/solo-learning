const CODE_BLOCK_RE = /```(?:\w*\n)?([\s\S]*?)```/g
const INLINE_RE = /(\*\*[\s\S]*?\*\*|`[^`]+`|\n)/g

const inlineCodeStyle = {
  fontFamily: 'var(--font-mono)',
  color: 'var(--accent)',
  background: 'rgba(68,102,255,0.1)',
  padding: '2px 6px',
  borderRadius: '2px',
}

const preStyle = {
  background: '#0a0a1c',
  border: '1px solid var(--border)',
  padding: '12px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.82rem',
  color: 'var(--text)',
  overflowX: 'auto',
  margin: '8px 0',
  display: 'block',
  textAlign: 'left',
}

function parseInline(text, keyBase) {
  const result = []
  let last = 0
  INLINE_RE.lastIndex = 0
  let match
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) result.push(text.slice(last, match.index))
    const tok = match[0]
    const key = `${keyBase}_${match.index}`
    if (tok === '\n') {
      result.push(<br key={key} />)
    } else if (tok.startsWith('**')) {
      result.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    } else {
      result.push(<code key={key} style={inlineCodeStyle}>{tok.slice(1, -1)}</code>)
    }
    last = match.index + tok.length
  }
  if (last < text.length) result.push(text.slice(last))
  return result
}

export default function RichPrompt({ text, className }) {
  if (!text) return null

  const segments = []
  let last = 0
  CODE_BLOCK_RE.lastIndex = 0
  let match
  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: 'inline', text: text.slice(last, match.index) })
    segments.push({ type: 'codeblock', text: match[1] })
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ type: 'inline', text: text.slice(last) })

  const content = segments.map((seg, i) =>
    seg.type === 'codeblock'
      ? <pre key={i} style={preStyle}><code>{seg.text}</code></pre>
      : <span key={i}>{parseInline(seg.text, String(i))}</span>
  )

  return <div className={className}>{content}</div>
}
