import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, TextField } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { toE164 } from '@/lib/phone';
import { colors, font, space } from '@/theme';

export default function SignIn() {
  const { requestCode, signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function send() {
    const phoneNumber = toE164(phone);
    setBusy(true);
    setError(null);
    try {
      await requestCode(phoneNumber);
      setSentTo(phoneNumber);
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      await signIn(sentTo, code);
      // The root layout's guard swaps to the app once the session exists.
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>loot</Text>
          <Text style={styles.tagline}>
            What’s happening around you, right now.
          </Text>

          {sentTo ? (
            <View style={styles.form}>
              <Text style={font.body}>
                Enter the 6-digit code sent to{' '}
                <Text style={styles.strong}>{sentTo}</Text>
              </Text>
              <TextField
                label="Code"
                value={code}
                onChangeText={(text) =>
                  setCode(text.replace(/\D/g, '').slice(0, 6))
                }
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                placeholder="123456"
                autoFocus
                onSubmitEditing={() => code.length === 6 && verify()}
              />
              {error ? <Banner tone="error" text={error} /> : null}
              <Button
                title="Verify and continue"
                onPress={verify}
                loading={busy}
                disabled={code.length !== 6}
              />
              <Button
                title="Use a different number"
                variant="secondary"
                onPress={() => setSentTo(null)}
                disabled={busy}
              />
              <Text style={styles.hint} onPress={busy ? undefined : send}>
                Didn’t get it? Send again
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <TextField
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                placeholder="98765 43210"
                hint="We’ll send a code on WhatsApp. +91 is added if you leave it out."
                onSubmitEditing={send}
              />
              {error ? <Banner tone="error" text={error} /> : null}
              <Button
                title="Send code"
                onPress={send}
                loading={busy}
                disabled={phone.replace(/\D/g, '').length < 8}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.xl,
    gap: space.xl,
  },
  logo: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  tagline: { color: colors.textMuted, fontSize: 17, marginTop: -space.md },
  form: { gap: space.md },
  strong: { fontWeight: '800' },
  hint: {
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '700',
    paddingVertical: space.sm,
  },
});
