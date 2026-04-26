export default function LoginScreen({ onSignIn }) {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="grid-bg" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.3em', color: 'var(--text-dim)' }}>
          [ SYSTEM ACCESS REQUIRED ]
        </div>
        <h1 style={{ fontFamily: 'var(--font-hud)', fontSize: '3rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '0.1em', lineHeight: 1.1 }}>
          SOLO LEARNING
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
          Train. Rank up. Clear the dungeons.
        </p>
        <button className="sys-btn" onClick={onSignIn}>
          [ LOGIN WITH GOOGLE ]
        </button>
      <a
        href="/privacy.html"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', textDecoration: 'none', marginTop: 'auto', alignSelf: 'center' }}
      >
        Privacy Policy
      </a>
      </div>
    </div>
  )
}
