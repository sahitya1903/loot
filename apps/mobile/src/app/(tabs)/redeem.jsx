import { RedeemBody, redeemCode } from '@loot/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner, Button, TextField } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { colors, font, radius, space } from '@/theme';

export default function Redeem() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const valid = RedeemBody.safeParse({ code }).success;

  const redeem = useMutation({
    mutationFn: () => redeemCode({ code }),
    onSuccess: () => {
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={font.heading}>Redeem a code</Text>
        <Text style={[font.body, styles.muted]}>
          Type the code on the customer’s screen. Each code works once, only at
          your business.
        </Text>
        <TextField
          label="Code"
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase());
            if (redeem.isSuccess || redeem.isError) redeem.reset();
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="LOOT-7Q3XAB"
          onSubmitEditing={() => valid && redeem.mutate()}
        />
        <Button
          title="Redeem"
          variant="pro"
          onPress={() => redeem.mutate()}
          loading={redeem.isPending}
          disabled={!valid}
        />

        {redeem.isError ? (
          <Banner tone="error" text={errorMessage(redeem.error)} />
        ) : null}
        {redeem.isSuccess ? (
          <View style={styles.success}>
            <Text style={styles.successTitle}>✓ Redeemed</Text>
            <Text style={font.body}>{redeem.data.loot.title}</Text>
            <Text style={styles.code}>{redeem.data.redemption.code}</Text>
            <Text style={font.small}>
              {redeem.data.loot.offerText ?? ''} · {redeem.data.loot.claimCount}{' '}
              claimed so far
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  muted: { color: colors.textMuted },
  success: {
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
    alignItems: 'center',
  },
  successTitle: { color: colors.success, fontWeight: '900', fontSize: 22 },
  code: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 2,
  },
});
