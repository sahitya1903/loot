import {
  BUSINESS_CATEGORIES,
  OnboardBusinessBody,
  onboardBusiness,
} from '@loot/shared';
import { useQueryClient } from '@tanstack/react-query';
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
import { Banner, Button, Chip, TextField } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { categoryLabel } from '@/lib/labels';
import { PRESET_AREAS, useFeedLocation } from '@/lib/location';
import { colors, font, space } from '@/theme';

/** zod issues → { 'branch.address': 'message' } */
function issuesToFields(issues) {
  return Object.fromEntries(
    issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

export default function Onboard() {
  const { refreshUser } = useAuth();
  const { location, locateWithGps } = useFeedLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    businessName: '',
    username: '',
    category: null,
    branchName: '',
    address: '',
  });
  const [spot, setSpot] = useState(location ? { ...location } : null);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit() {
    const body = {
      businessName: form.businessName,
      username: form.username,
      category: form.category ?? undefined,
      branch: {
        name: form.branchName,
        address: form.address,
        latitude: spot?.latitude,
        longitude: spot?.longitude,
      },
    };
    const parsed = OnboardBusinessBody.safeParse(body);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(true);
    try {
      await onboardBusiness(parsed.data);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['business'] });
      router.replace('/business');
    } catch (err) {
      setErrors(fieldErrors(err));
      setFailure(errorMessage(err));
      setBusy(false);
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
        <Banner text="Business accounts post loot and redeem codes. They can’t claim loot themselves." />

        <TextField
          label="Business name"
          value={form.businessName}
          onChangeText={set('businessName')}
          error={errors.businessName}
        />
        <TextField
          label="Username"
          value={form.username}
          onChangeText={(text) => set('username')(text.toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="brewlab"
          error={errors.username}
          hint="Letters, numbers, dots and underscores."
        />

        <Text style={font.label}>Category</Text>
        <View style={styles.wrap}>
          {BUSINESS_CATEGORIES.map((c) => (
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

        <Text style={[font.heading, styles.section]}>Your first location</Text>
        <TextField
          label="Branch name"
          value={form.branchName}
          onChangeText={set('branchName')}
          placeholder="Indiranagar"
          error={errors['branch.name']}
        />
        <TextField
          label="Address"
          value={form.address}
          onChangeText={set('address')}
          placeholder="100 Feet Rd, Indiranagar"
          error={errors['branch.address']}
        />

        <Text style={font.label}>Pin on the map</Text>
        <View style={styles.wrap}>
          <Chip
            label="Where I am now"
            selected={spot?.source === 'gps'}
            color={colors.pro}
            onPress={async () => {
              const result = await locateWithGps();
              if (result.ok) setSpot(result.location);
              else
                setFailure('Couldn’t read GPS. Pick the nearest area instead.');
            }}
          />
          {PRESET_AREAS.map((area) => (
            <Chip
              key={area.label}
              label={area.label}
              selected={spot?.label === area.label}
              color={colors.pro}
              onPress={() => setSpot({ ...area, source: 'manual' })}
            />
          ))}
        </View>
        <Text style={font.small}>
          {spot
            ? `Pinned at ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`
            : 'Not pinned yet'}
        </Text>
        {errors['branch.latitude'] ? (
          <Text style={styles.error}>Choose where your business is</Text>
        ) : null}

        {failure ? <Banner tone="error" text={failure} /> : null}
        <Button
          title="Create business"
          variant="pro"
          onPress={submit}
          loading={busy}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { marginTop: space.md },
  error: { color: colors.danger, fontSize: 13 },
});
