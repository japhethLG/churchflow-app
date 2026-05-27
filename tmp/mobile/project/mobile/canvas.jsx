// ChurchFlow mobile design canvas — composes iPhone frames showing
// each screen variant. Driven by Tweaks for nav pattern / density / color.

const FRAME_W = 390;
const FRAME_H = 844;

// Each "phone" is an IOSDevice wrapper containing a CF-mobile root with
// a frozen screen state (current tab, open sheet, etc.).
function Phone({
  width = FRAME_W,
  height = FRAME_H,
  children,
  density = 'cozy',
  primary = 'indigo',
}) {
  return (
    <IOSDevice width={width} height={height} dark>
      <div
        className="cf-mobile"
        data-density={density}
        data-primary={primary}
        style={{
          width: '100%', height: '100%', position: 'relative',
          background: 'var(--background)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </IOSDevice>
  );
}

// ─── Phone scenes ──────────────────────────────────────────────────────

function DashboardPhone({ navVariant, density, primary, label = 'Dashboard' }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <MobileNav variant={navVariant} active="dashboard" />
    </Phone>
  );
}

function DashboardScrolledPhone({ navVariant, density, primary }) {
  // Same dashboard but auto-scrolled to show pledges + campaigns + gifts.
  return (
    <Phone density={density} primary={primary}>
      <div
        ref={(el) => { if (el) el.scrollTop = 540; }}
        style={{ position: 'absolute', inset: 0, overflow: 'auto' }}
        className="no-scrollbar"
      >
        <DashboardScreen />
      </div>
      <MobileNav variant={navVariant} active="dashboard" />
    </Phone>
  );
}

function MoreSheetPhone({ navVariant, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <Scrim opacity={0.6}>
        <MoreSheet />
      </Scrim>
      <MobileNav variant={navVariant} moreActive active="dashboard" />
    </Phone>
  );
}

function AccountSheetPhone({ navVariant, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <Scrim opacity={0.6}>
        <AccountSheet />
      </Scrim>
    </Phone>
  );
}

function RecordGiftPhone({ navVariant, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <Scrim opacity={0.65}>
        <RecordGiftSheet />
      </Scrim>
    </Phone>
  );
}

function NotificationsPhone({ navVariant, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <Scrim opacity={0.6}>
        <NotificationsSheet />
      </Scrim>
    </Phone>
  );
}

function SearchPhone({ navVariant, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <SearchOverlay />
    </Phone>
  );
}

// Showcase of all 3 nav variants in their own phones.
function NavVariantPhone({ variant, label, density, primary }) {
  return (
    <Phone density={density} primary={primary}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="no-scrollbar">
        <DashboardScreen />
      </div>
      <MobileNav variant={variant} active="dashboard" />
      {/* Floating label so the canvas card name maps to the variant */}
      <div style={{
        position: 'absolute', top: 60, left: 16,
        padding: '4px 10px', borderRadius: 9999,
        background: 'rgba(11,13,17,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        color: 'var(--primary-soft-fg)',
      }}>
        {label}
      </div>
    </Phone>
  );
}

// Compact 3-up nav comparison strip (smaller phones, just the bottom).
function NavComparisonStrip({ density, primary }) {
  const W = 220, H = 380;
  const variants = [
    { v: 'tabs', label: 'V1 · Conventional', sub: '5 tabs · iconographic + label' },
    { v: 'fab',  label: 'V2 · FAB-centered', sub: 'Record gift always 1 tap' },
    { v: 'pill', label: 'V3 · Floating pill', sub: 'Icon-only, lightest chrome' },
  ];
  return (
    <div style={{ display: 'flex', gap: 28 }}>
      {variants.map(({ v, label, sub }) => (
        <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: W }}>
          <div style={{
            position: 'relative', width: W, height: H,
            borderRadius: 36, overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}>
            <div
              className="cf-mobile"
              data-density={density}
              data-primary={primary}
              style={{
                width: FRAME_W, height: FRAME_H,
                transform: `scale(${W / FRAME_W})`,
                transformOrigin: 'top left',
                position: 'absolute', top: 0, left: 0,
                background: 'var(--background)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <DashboardScreen />
              </div>
              <MobileNav variant={v} active="dashboard" />
            </div>
          </div>
          <div style={{ textAlign: 'center', fontFamily: '-apple-system, system-ui' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(40,30,20,.85)' }}>{label}</div>
            <div style={{ fontSize: 11, color: 'rgba(60,50,40,.6)', marginTop: 2 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Canvas root ───────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "nav": "tabs",
  "density": "cozy",
  "primary": "indigo",
  "greetingStyle": "two-line",
  "cardStyle": "elevated"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const nav = t.nav;
  const density = t.density;
  const primary = t.primary;

  return (
    <React.Fragment>
      <TweaksPanel title="ChurchFlow Mobile · Tweaks">
        <TweakSection label="Navigation">
          <TweakSelect
            label="Nav pattern"
            value={t.nav}
            options={[
              { value: 'tabs', label: 'V1 · Conventional tabs' },
              { value: 'fab',  label: 'V2 · FAB-centered' },
              { value: 'pill', label: 'V3 · Floating pill' },
            ]}
            onChange={(v) => setTweak('nav', v)}
          />
        </TweakSection>
        <TweakSection label="Density">
          <TweakRadio
            label="Spacing"
            value={t.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'cozy',    label: 'Cozy' },
              { value: 'comfy',   label: 'Comfy' },
            ]}
            onChange={(v) => setTweak('density', v)}
          />
        </TweakSection>
        <TweakSection label="Primary color">
          <TweakSelect
            label="Palette"
            value={t.primary}
            options={[
              { value: 'indigo', label: 'Indigo (default)' },
              { value: 'clay',   label: 'Clay' },
              { value: 'forest', label: 'Forest' },
              { value: 'ocean',  label: 'Ocean' },
            ]}
            onChange={(v) => setTweak('primary', v)}
          />
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas defaultZoom={0.7}>
        <DCSection
          id="nav-variants"
          title="Mobile navigation — 3 variants"
          subtitle="Pick a default in Tweaks ↘ then compare against the alternatives."
        >
          <DCArtboard id="v1-tabs" label="V1 · Conventional tabs" width={FRAME_W} height={FRAME_H + 60}>
            <NavVariantPhone variant="tabs" label="V1 · CONVENTIONAL" density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="v2-fab" label="V2 · FAB-centered" width={FRAME_W} height={FRAME_H + 60}>
            <NavVariantPhone variant="fab" label="V2 · FAB CENTER" density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="v3-pill" label="V3 · Floating pill" width={FRAME_W} height={FRAME_H + 60}>
            <NavVariantPhone variant="pill" label="V3 · FLOATING PILL" density={density} primary={primary} />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="dashboard"
          title="Admin dashboard"
          subtitle="Reuses every dashboard card from src/components/pages/dashboard, restacked for one column."
        >
          <DCArtboard id="dash-top" label="Greeting + snapshot" width={FRAME_W} height={FRAME_H + 60}>
            <DashboardPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="dash-scrolled" label="Pledges · Campaigns · Gifts" width={FRAME_W} height={FRAME_H + 60}>
            <DashboardScrolledPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="sheets"
          title="Sheets & overlays"
          subtitle="Modal surfaces — More menu, Account (tap church up top), Record gift, Notifications, Search."
        >
          <DCArtboard id="more" label="More sheet (nav overflow)" width={FRAME_W} height={FRAME_H + 60}>
            <MoreSheetPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="account" label="Account sheet (tap church)" width={FRAME_W} height={FRAME_H + 60}>
            <AccountSheetPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="record" label="Record gift" width={FRAME_W} height={FRAME_H + 60}>
            <RecordGiftPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="notif" label="Notifications" width={FRAME_W} height={FRAME_H + 60}>
            <NotificationsPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
          <DCArtboard id="search" label="Search" width={FRAME_W} height={FRAME_H + 60}>
            <SearchPhone navVariant={nav} density={density} primary={primary} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </React.Fragment>
  );
}

Object.assign(window, { App, Phone, DashboardPhone, NavVariantPhone });
