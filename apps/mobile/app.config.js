// Dynamic config on top of app.json.
//
// The API URL is baked into the JS bundle at build time (EXPO_PUBLIC_API_URL). Development and
// demo builds talk to a plain-http API on the dev machine (10.0.2.2 from the emulator, the LAN IP
// from a phone), which Android blocks by default since Android 9. Allow cleartext traffic only
// when the API is http, so an https production build stays strict.
module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const devApi = apiUrl === '' || apiUrl.startsWith('http://');

  return {
    ...config,
    plugins: [
      ...config.plugins,
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: devApi,
            // Demo builds: modern phones + the x86_64 emulator only, for a faster build and a
            // smaller APK. Production builds keep every ABI.
            ...(devApi ? { buildArchs: ['arm64-v8a', 'x86_64'] } : {}),
          },
        },
      ],
    ],
  };
};
