// ============ AUTH PAGES ============
const S = window.SANCTUARY;

// 6.2 Login Page
const LoginPage = () => (
  <div style={{
    width: '100%', height: '100%',
    background: `linear-gradient(135deg, ${S.primaryFixed} 0%, #FFFFFF 55%, ${S.tertiaryContainer} 120%)`,
    display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    {/* Top bar */}
    <div style={{ padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Wordmark size="md" />
    </div>

    {/* Body */}
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 40px', gap: 40 }}>
      {/* Card */}
      <div style={{ justifySelf: 'center', width: 440 }}>
        <div style={{
          background: S.surfaceContainerLowest, borderRadius: 24, padding: 40,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 12 }}>
            Sign in
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', color: S.onSurface, margin: 0, lineHeight: 1.1 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 12, lineHeight: 1.55 }}>
            Sign in to your church's dashboard. Your giving history and upcoming services will be right where you left them.
          </p>

          <div style={{ marginTop: 32 }}>
            <Button variant="primary" size="lg" fullWidth icon="google">
              Continue with Google
            </Button>
          </div>

          <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 20, lineHeight: 1.5, textAlign: 'center' }}>
            By continuing you agree to our{' '}
            <span style={{ textDecoration: 'underline', color: S.onSurfaceVariant }}>Terms</span> and{' '}
            <span style={{ textDecoration: 'underline', color: S.onSurfaceVariant }}>Privacy Policy</span>.
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: S.onSurfaceMuted, textAlign: 'center' }}>
          New to ChurchFlow? Ask your church administrator for an invite.
        </div>
      </div>

      {/* Illustration */}
      <div style={{ justifySelf: 'center', width: 440, height: 440, position: 'relative' }}>
        <JournalIllustration />
      </div>
    </div>

    <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: S.onSurfaceMuted }}>
      <span>Built for churches.</span>
      <span style={{ display: 'flex', gap: 20 }}>
        <span>Privacy</span><span>Terms</span><span>Support</span>
      </span>
    </div>
  </div>
);

// Soft duotone journal illustration (line-art only, per brief)
const JournalIllustration = () => (
  <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none">
    <defs>
      <linearGradient id="jGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4F46E5" stopOpacity="0.12" />
        <stop offset="1" stopColor="#7E3000" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    {/* subtle circle behind */}
    <circle cx="200" cy="200" r="160" fill="url(#jGrad)" />
    {/* Journal back */}
    <rect x="90" y="130" width="220" height="160" rx="10" stroke="#4F46E5" strokeWidth="2" strokeOpacity="0.45" fill="#FFFFFF" />
    {/* Journal front (left page) */}
    <rect x="90" y="130" width="110" height="160" rx="10" stroke="#4F46E5" strokeWidth="2" strokeOpacity="0.6" fill="#F7F9FB" />
    {/* Spine shadow */}
    <line x1="200" y1="130" x2="200" y2="290" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.3" />
    {/* Lines */}
    {[165, 185, 205, 225, 245].map((y, i) => (
      <line key={i} x1="108" y1={y} x2={180} y2={y} stroke="#4F46E5" strokeWidth="1.5" strokeOpacity={0.25 + i * 0.02} strokeLinecap="round" />
    ))}
    {[165, 185, 205, 225].map((y, i) => (
      <line key={i} x1="220" y1={y} x2={290} y2={y} stroke="#4F46E5" strokeWidth="1.5" strokeOpacity={0.25 + i * 0.02} strokeLinecap="round" />
    ))}
    {/* Bookmark ribbon (clay) */}
    <path d="M260 130 L260 320 L275 305 L290 320 L290 130 Z" fill="#7E3000" fillOpacity="0.7" />
    {/* Pen */}
    <g transform="rotate(18 210 270)">
      <rect x="150" y="265" width="120" height="8" rx="3" fill="#4F46E5" fillOpacity="0.85" />
      <path d="M270 265 L285 269 L270 273 Z" fill="#191C1E" />
      <rect x="150" y="265" width="18" height="8" rx="2" fill="#7E3000" />
    </g>
    {/* small sparkle */}
    <circle cx="140" cy="155" r="3" fill="#7E3000" fillOpacity="0.6" />
    <circle cx="300" cy="165" r="2.5" fill="#4F46E5" fillOpacity="0.5" />
  </svg>
);

// 6.3 Invite Page
const InvitePage = () => (
  <div style={{
    width: '100%', height: '100%',
    background: `linear-gradient(135deg, ${S.primaryFixed} 0%, #FFFFFF 55%, ${S.tertiaryContainer} 120%)`,
    display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <div style={{ padding: '28px 40px' }}><Wordmark /></div>
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ width: 480, background: S.surfaceContainerLowest, borderRadius: 24, padding: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.tertiary, marginBottom: 12 }}>
          Invitation
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', color: S.onSurface, margin: 0, lineHeight: 1.2 }}>
          You've been invited to{' '}
          <span style={{
            background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Grace Community Church</span>.
        </h1>
        <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 14, lineHeight: 1.55 }}>
          Pastor David Obi invited you to join as a <strong style={{ color: S.onSurface }}>Member</strong>. Sign in with Google to accept and see the gifts Grace Community has recorded for you.
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 28, padding: 16, background: S.surfaceContainerLow, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
              color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600,
            }}>GC</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Grace Community</div>
              <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>hello@gracecommunity.org</div>
            </div>
          </div>
          <div style={{ width: 1, background: S.surfaceContainer }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <Avatar name="David Obi" size={36} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>David Obi</div>
              <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>Pastor · Admin</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" size="lg" fullWidth icon="google">
            Accept & Continue with Google
          </Button>
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: 'center' }}>
          This wasn't meant for me
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: S.onSurfaceMuted, textAlign: 'center' }}>
          Invitation expires in 6 days.
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { LoginPage, InvitePage, JournalIllustration });
