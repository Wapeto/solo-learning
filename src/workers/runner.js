const timer = setTimeout(() => {
  self.postMessage({ error: 'Execution timed out (3s)' })
  self.close()
}, 3000)

self.onmessage = ({ data }) => {
  const { code, tests, mode } = data
  try {
    const match = code.match(/function\s+(\w+)/)
    if (!match) throw new Error('No named function found in code.')
    const fnName = match[1]
    // eslint-disable-next-line no-new-func
    const fn = new Function(`${code}; return ${fnName};`)()

    if (mode === 'test') {
      const results = tests.map(test => {
        try {
          const got = fn(...test.input)
          return { description: test.description, got }
        } catch (e) {
          return { description: test.description, error: e.message }
        }
      })
      clearTimeout(timer)
      self.postMessage({ mode: 'test', results })
    } else {
      const results = tests.map(test => {
        try {
          const got = fn(...test.input)
          const passed = JSON.stringify(got) === JSON.stringify(test.expected)
          return { description: test.description, passed, expected: test.expected, got }
        } catch (e) {
          return { description: test.description, passed: false, expected: test.expected, error: e.message }
        }
      })
      clearTimeout(timer)
      self.postMessage({ mode: 'validate', results })
    }
  } catch (e) {
    clearTimeout(timer)
    self.postMessage({ error: e.message })
  }
}
