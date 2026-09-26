import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { formatDistance } from '@loot/shared/geo';

// Placeholder screen — proves the @loot/shared wiring. The consumer feed
// (Nearby / Following / Trending / Fresh) gets built here next.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loot</Text>
      <Text style={styles.subtitle}>What&apos;s happening {formatDistance(0.4)}?</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ff4d6d',
    fontSize: 40,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
});
