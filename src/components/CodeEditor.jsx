import { useEffect, useRef } from 'react'

const LOADER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js'
const VS_BASE    = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'

function loadMonaco(callback) {
  if (window.__monacoReady) { callback(window.monaco); return }
  window.__monacoQueue = window.__monacoQueue || []
  window.__monacoQueue.push(callback)
  if (window.__monacoLoading) return
  window.__monacoLoading = true

  const script = document.createElement('script')
  script.src = LOADER_URL
  script.onload = () => {
    window.require.config({ paths: { vs: VS_BASE } })
    window.require(['vs/editor/editor.main'], monaco => {
      monaco.editor.defineTheme('solo-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background':              '#05050e',
          'editor.lineHighlightBackground': '#0a0a1c',
          'editorLineNumber.foreground':    '#2a3a6a',
          'editor.selectionBackground':     '#1a2660',
          'editorGutter.background':        '#05050e',
        },
      })
      window.monaco = monaco
      window.__monacoReady = true
      ;(window.__monacoQueue || []).forEach(cb => cb(monaco))
      window.__monacoQueue = []
    })
  }
  document.head.appendChild(script)
}

export default function CodeEditor({ language = 'javascript', defaultValue = '', onChange }) {
  const containerRef = useRef(null)
  const editorRef    = useRef(null)
  const onChangeRef  = useRef(onChange)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    let disposed = false
    loadMonaco(monaco => {
      if (disposed || !containerRef.current) return
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: defaultValue,
        language,
        theme: 'solo-dark',
        minimap:             { enabled: false },
        fontSize:            14,
        lineNumbers:         'on',
        scrollBeyondLastLine: false,
        automaticLayout:     true,
        padding:             { top: 12, bottom: 12 },
        fontFamily:          "'Share Tech Mono', monospace",
        overviewRulerLanes:  0,
        hideCursorInOverviewRuler: true,
      })
      editorRef.current.onDidChangeModelContent(() => {
        onChangeRef.current?.(editorRef.current.getValue())
      })
    })
    return () => {
      disposed = true
      editorRef.current?.dispose()
      editorRef.current = null
    }
  }, []) // mount once

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== defaultValue) {
      editorRef.current.setValue(defaultValue)
    }
  }, [defaultValue])

  return <div ref={containerRef} className="code-editor-container" />
}
