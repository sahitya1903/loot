import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, space } from '@/theme';

const STATUS = {
  issued: { label: 'Ready to redeem', color: colors.success },
  used: { label: 'Redeemed', color: colors.textMuted },
  expired: { label: 'Expired', color: colors.danger },
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** The claim's code: shown at the counter as a QR code and as text the business can type. */
export function RedemptionCard({ redemption, compact = false }) {
  const status = STATUS[redemption.status] ?? STATUS.issued;
  const usable = redemption.status === 'issued';
  return (
    <View style={[styles.card, !usable && styles.dim]}>
      <Text style={[styles.status, { color: status.color }]}>
        {status.label.toUpperCase()}
      </Text>
      {usable && !compact ? (
        <View style={styles.qr}>
          <QRCode
            value={redemption.qrPayload}
            size={180}
            backgroundColor="#ffffff"
            color="#000000"
          />
        </View>
      ) : null}
      <Text selectable style={[styles.code, compact && styles.codeCompact]}>
        {redemption.code}
      </Text>
      <Text style={styles.meta}>
        {redemption.status === 'used'
          ? `Redeemed ${formatTime(redemption.usedAt)}`
          : usable
            ? `Show this at the counter · valid until ${formatTime(redemption.expiresAt)}`
            : `Expired ${formatTime(redemption.expiresAt)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dim: { opacity: 0.7 },
  status: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  qr: {
    padding: space.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
  },
  code: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  codeCompact: { fontSize: 20 },
  meta: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
