import { router } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner, Button, Chip } from '@/components/ui';
import {
  PRESET_AREAS,
  RADIUS_OPTIONS_KM,
  useFeedLocation,
} from '@/lib/location';
import { colors, font, radius, space } from '@/theme';

export default function LocationScreen() {
  const { location, radiusKm, locateWithGps, chooseArea, setRadiusKm } =
    useFeedLocation();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  async function locate() {
    setBusy(true);
    setProblem(null);
    const result = await locateWithGps();
    setBusy(false);
    if (result.ok) router.back();
    else setProblem(result.reason);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button title="Use my current location" onPress={locate} loading={busy} />
      {problem === 'denied' ? (
        <View style={styles.gap}>
          <Banner
            tone="error"
            text="Location permission is off. Pick an area below, or allow it in Settings."
          />
          <Button
            title="Open Settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        </View>
      ) : null}
      {problem === 'unavailable' ? (
        <Banner
          tone="error"
          text="Couldn’t get a GPS fix. Pick an area below."
        />
      ) : null}

      <Text style={[font.label, styles.section]}>Or choose an area</Text>
      {PRESET_AREAS.map((area) => {
        const selected =
          location?.source === 'manual' && location.label === area.label;
        return (
          <Pressable
            key={area.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              chooseArea(area);
              router.back();
            }}
            style={[styles.area, selected && styles.areaSelected]}
          >
            <Text style={font.body}>{area.label}</Text>
          </Pressable>
        );
      })}

      <Text style={[font.label, styles.section]}>Search radius</Text>
      <View style={styles.row}>
        {RADIUS_OPTIONS_KM.map((km) => (
          <Chip
            key={km}
            label={`${km} km`}
            selected={radiusKm === km}
            onPress={() => setRadiusKm(km)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.sm, backgroundColor: colors.bg },
  gap: { gap: space.sm },
  section: { marginTop: space.lg },
  area: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaSelected: { borderColor: colors.accent },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
