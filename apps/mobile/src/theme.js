// Design tokens. Loot is dark, high-contrast and energetic; urgency colours carry meaning.

export const colors = {
  bg: '#0c0c0e',
  surface: '#16161a',
  surfaceRaised: '#1f1f25',
  border: '#2c2c34',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.62)',
  textFaint: 'rgba(255,255,255,0.38)',
  accent: '#ff4d6d',
  accentText: '#ffffff',
  pro: '#7c5cff',
  success: '#2ecc71',
  danger: '#ff5a5a',
  // Urgency tiers from @loot/shared urgencyTier()
  urgent: '#ff4d6d',
  warm: '#ffb020',
  normal: '#3ddc97',
  expired: 'rgba(255,255,255,0.38)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const font = {
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
};

export const headerOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};
