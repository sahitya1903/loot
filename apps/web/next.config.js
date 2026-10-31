const nextConfig = {
  // @loot/shared is an uncompiled workspace package — let Next compile it.
  transpilePackages: ['@loot/shared'],
  allowedDevOrigins: [
    // LAN address allowed to open the dev server (testing from a phone)
    '10.145.2.167',
  ],
}

export default nextConfig
