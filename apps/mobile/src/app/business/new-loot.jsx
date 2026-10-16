import {
  CreateLootBody,
  LOOT_CATEGORIES,
  createLoot,
  getMyBusiness,
  queryKeys,
} from '@loot/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner, Button, Chip, StateView, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { categoryLabel } from '@/lib/labels';
import { colors, font, radius, space } from '@/theme';

const MIN = 60_000;
const EXPIRY_PRESETS = [
  { label: '30 min', ms: 30 * MIN },
  { label: '1 hour', ms: 60 * MIN },
  { label: '3 hours', ms: 3 * 60 * MIN },
  { label: '6 hours', ms: 6 * 60 * MIN },
  { label: 'Tonight', ms: null },
  { label: '1 day', ms: 24 * 60 * MIN },
  { label: '3 days', ms: 3 * 24 * 60 * MIN },
  { label: '7 days', ms: 7 * 24 * 60 * MIN },
];

/** 11:59 pm today, or tomorrow's if that's under an hour away. */
function tonight(now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 0, 0);
  if (end.getTime() - now.getTime() < 60 * MIN) end.setDate(end.getDate() + 1);
  return end;
}

const toNumber = (text) => (text.trim() === '' ? undefined : Number(text));

export default function NewLoot() {
  const queryClient = useQueryClient();
  const business = useQuery({
    queryKey: queryKeys.business.mine(),
    queryFn: getMyBusiness,
  });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: null,
    offerText: '',
    originalPrice: '',
    offerPrice: '',
    totalQuantity: '',
    expiry: '3 hours',
    imageUrl: '',
    terms: '',
    branchId: null,
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(null);
  const set = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (business.isPending) return <StateView loading />;
  if (business.isError) {
    return (
      <StateView
        error
        message={errorMessage(business.error)}
        onAction={() => business.refetch()}
      />
    );
  }
  const branches = business.data.business.branchLocations;
  const branchId = form.branchId ?? branches[0]?.branchId;

  async function submit(status) {
    const preset = EXPIRY_PRESETS.find((p) => p.label === form.expiry);
    const expiryAt = preset.ms ? new Date(Date.now() + preset.ms) : tonight();
    const body = {
      title: form.title,
      description: form.description,
      category: form.category ?? undefined,
      branchId,
      offerText: form.offerText.trim() || undefined,
      originalPrice: toNumber(form.originalPrice),
      offerPrice: toNumber(form.offerPrice),
      totalQuantity: toNumber(form.totalQuantity),
      expiryAt: expiryAt.toISOString(),
      media: form.imageUrl.trim()
        ? [{ url: form.imageUrl.trim(), mediaType: 'image' }]
        : [],
      terms: form.terms.trim() || undefined,
      status,
    };
    const parsed = CreateLootBody.safeParse(body);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), i.message]),
        ),
      );
      setFailure('Check the highlighted fields.');
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(status);
    try {
      // Send the raw body: the API parses it with the same schema.
      const { loot } = await createLoot(body);
      queryClient.invalidateQueries({ queryKey: ['business'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.replace(`/loot/${loot.id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFailure(errorMessage(err));
      setBusy(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Title"
          value={form.title}
          onChangeText={set('title')}
          placeholder="Buy 1 Get 1 cold brew"
          error={errors.title}
        />
        <TextField
          label="Offer headline"
          value={form.offerText}
          onChangeText={set('offerText')}
          placeholder="Buy 1 Get 1 · 40% off · Free entry"
          error={errors.offerText}
        />
        <View style={styles.row}>
          <TextField
            style={styles.half}
            label="Original price (₹)"
            value={form.originalPrice}
            onChangeText={set('originalPrice')}
            keyboardType="numeric"
            error={errors.originalPrice}
          />
          <TextField
            style={styles.half}
            label="Offer price (₹)"
            value={form.offerPrice}
            onChangeText={set('offerPrice')}
            keyboardType="numeric"
            error={errors.offerPrice}
          />
        </View>
        <TextField
          label="How many?"
          value={form.totalQuantity}
          onChangeText={set('totalQuantity')}
          keyboardType="number-pad"
          placeholder="Leave empty for unlimited"
          error={errors.totalQuantity}
        />

        <Text style={font.label}>Ends in</Text>
        <View style={styles.wrap}>
          {EXPIRY_PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              selected={form.expiry === p.label}
              color={colors.pro}
              onPress={() => set('expiry')(p.label)}
            />
          ))}
        </View>
        {errors.expiryAt ? (
          <Text style={styles.error}>{errors.expiryAt}</Text>
        ) : null}

        <Text style={font.label}>Category</Text>
        <View style={styles.wrap}>
          {LOOT_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={categoryLabel(c)}
              selected={form.category === c}
              color={colors.pro}
              onPress={() => set('category')(c)}
            />
          ))}
        </View>
        {errors.category ? (
          <Text style={styles.error}>Pick a category</Text>
        ) : null}

        {branches.length > 1 ? (
          <>
            <Text style={font.label}>Branch</Text>
            <View style={styles.wrap}>
              {branches.map((b) => (
                <Chip
                  key={b.branchId}
                  label={b.name}
                  selected={branchId === b.branchId}
                  color={colors.pro}
                  onPress={() => set('branchId')(b.branchId)}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={font.small}>At {branches[0]?.name}</Text>
        )}

        <TextField
          label="Photo link"
          value={form.imageUrl}
          onChangeText={set('imageUrl')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://…"
          hint="Paste an https image link. Direct photo upload is coming."
          error={errors['media.0.url']}
        />
        {/^https:\/\/\S+$/.test(form.imageUrl.trim()) ? (
          <Image
            source={{ uri: form.imageUrl.trim() }}
            style={styles.preview}
            contentFit="cover"
          />
        ) : null}

        <TextField
          label="Details"
          value={form.description}
          onChangeText={set('description')}
          multiline
          placeholder="What do people get, and how do they redeem it?"
          error={errors.description}
        />
        <TextField
          label="Terms (optional)"
          value={form.terms}
          onChangeText={set('terms')}
          multiline
          error={errors.terms}
        />

        {failure ? <Banner tone="error" text={failure} /> : null}
        <Button
          title="Publish now"
          variant="pro"
          onPress={() => submit('active')}
          loading={busy === 'active'}
          disabled={Boolean(busy)}
        />
        <Button
          title="Save as draft"
          variant="secondary"
          onPress={() => submit('draft')}
          loading={busy === 'draft'}
          disabled={Boolean(busy)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  row: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  error: { color: colors.danger, fontSize: 13 },
  preview: {
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
});
