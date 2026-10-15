// Small building blocks shared by every screen.

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, font, radius, space } from '@/theme';

/** @param {{ variant?: 'primary' | 'secondary' | 'pro' | 'danger', loading?: boolean, disabled?: boolean }} props */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function TextField({ label, error, hint, style, ...input }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={font.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        style={[
          styles.input,
          error && styles.inputError,
          input.multiline && styles.multiline,
        ]}
        {...input}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={font.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, color = colors.accent }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Loading, empty and error states with an optional retry. */
export function StateView({
  loading,
  error,
  empty,
  title,
  message,
  actionLabel,
  onAction,
}) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={[font.heading, styles.center]}>
        {title ?? (error ? 'Something went wrong' : 'Nothing here yet')}
      </Text>
      {message ? (
        <Text style={[font.body, styles.muted, styles.center]}>{message}</Text>
      ) : null}
      {onAction ? (
        <Button
          title={actionLabel ?? (error ? 'Try again' : 'Refresh')}
          onPress={onAction}
          variant={empty ? 'secondary' : 'primary'}
          style={styles.stateButton}
        />
      ) : null}
    </View>
  );
}

export function Banner({ text, tone = 'info' }) {
  return (
    <View style={[styles.banner, tone === 'error' && styles.bannerError]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  pro: { backgroundColor: colors.pro },
  danger: { backgroundColor: colors.danger },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '800' },
  secondaryText: { color: colors.text },
  field: { gap: space.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
  multiline: { minHeight: 96, paddingTop: space.md, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  chipTextSelected: { color: colors.text },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  stateButton: { alignSelf: 'stretch', marginTop: space.sm },
  center: { textAlign: 'center' },
  muted: { color: colors.textMuted },
  banner: {
    backgroundColor: colors.surfaceRaised,
    padding: space.md,
    borderRadius: radius.md,
  },
  bannerError: { backgroundColor: 'rgba(255,90,90,0.15)' },
  bannerText: { color: colors.text, fontSize: 14 },
});
