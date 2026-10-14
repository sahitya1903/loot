// Demo data for local development: four fictional businesses around Indiranagar/Koramangala,
// Bengaluru, a dozen live loot with varied urgency and stock, and one hunter account.
//
//   npm run seed --workspace=apps/api
//
// Safe to re-run: it only replaces its own demo records (fixed phone numbers and
// `demo_` usernames) and never drops a collection. Refuses to run in production.
// Sign in with any demo phone; the OTP is printed in the API log (no WhatsApp in dev).

import { geoHash } from '@loot/shared'
import mongoose from 'mongoose'
import { loadEnv } from '../src/config/env.js'
import { Business, toBranchFields } from '../src/modules/businesses/business.model.js'
import { Follow } from '../src/modules/businesses/follow.model.js'
import { Claim } from '../src/modules/engagement/claim.model.js'
import { Save } from '../src/modules/engagement/save.model.js'
import { liveStatusFor } from '../src/modules/loot/lifecycle.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import { branchFields } from '../src/modules/loot/loot.routes.js'
import { User } from '../src/modules/users/user.model.js'

try {
  process.loadEnvFile()
} catch {
  // no .env file
}
const env = loadEnv()
if (env.NODE_ENV === 'production') {
  console.error('Refusing to seed a production database.')
  process.exit(1)
}

const HUNTER_PHONE = '+919999900100'
const MIN = 60_000
const HOUR = 60 * MIN
const image = (seed) => [{ url: `https://picsum.photos/seed/${seed}/800/1000`, mediaType: 'image' }]

const BUSINESSES = [
  {
    phone: '+919999900001',
    username: 'demo_brewlab',
    businessName: 'Brew Lab Cafe',
    category: 'cafe',
    about: 'Small-batch coffee and bakes.',
    branch: { name: 'Indiranagar', address: '100 Feet Rd, Indiranagar', latitude: 12.9719, longitude: 77.6412 },
    loot: [
      {
        title: 'Buy 1 Get 1 cold brew',
        category: 'food_drink',
        offerText: 'Buy 1 Get 1',
        originalPrice: 240,
        offerPrice: 120,
        totalQuantity: 40,
        expiresIn: 45 * MIN,
        lootType: 'flash',
      },
      {
        title: 'Free croissant with any latte',
        category: 'food_drink',
        offerText: 'Free croissant',
        totalQuantity: 25,
        expiresIn: 5 * HOUR,
      },
      {
        title: 'Latte art workshop, 50% off',
        category: 'experiences',
        offerText: '50% off',
        originalPrice: 1200,
        offerPrice: 600,
        totalQuantity: 8,
        expiresIn: 2 * 24 * HOUR,
        lootType: 'experience',
      },
    ],
  },
  {
    phone: '+919999900002',
    username: 'demo_neonalley',
    businessName: 'Neon Alley',
    category: 'bar_club',
    about: 'Rooftop bar with live DJ sets.',
    branch: { name: '12th Main', address: '12th Main Rd, Indiranagar', latitude: 12.9784, longitude: 77.6408 },
    loot: [
      {
        title: 'Happy hour extended till 10pm',
        category: 'nightlife',
        offerText: '2 for 1 cocktails',
        expiresIn: 3 * HOUR,
        lootType: 'flash',
      },
      {
        title: 'Skip-the-line entry Saturday',
        category: 'nightlife',
        offerText: 'Free entry',
        originalPrice: 500,
        offerPrice: 0,
        totalQuantity: 30,
        expiresIn: 26 * HOUR,
        lootType: 'drop',
      },
      {
        title: 'Free mocktail for designated drivers',
        category: 'nightlife',
        offerText: 'Free mocktail',
        expiresIn: 6 * 24 * HOUR,
      },
    ],
  },
  {
    phone: '+919999900003',
    username: 'demo_kinetic',
    businessName: 'Kinetic Studio',
    category: 'gym_studio',
    about: 'Boxing, HIIT and yoga.',
    branch: {
      name: 'Koramangala',
      address: '80 Feet Rd, Koramangala 4th Block',
      latitude: 12.9352,
      longitude: 77.6245,
    },
    loot: [
      {
        title: 'First boxing class free',
        category: 'wellness',
        offerText: 'Free trial class',
        originalPrice: 800,
        offerPrice: 0,
        totalQuantity: 12,
        expiresIn: 90 * MIN,
        lootType: 'flash',
      },
      {
        title: '10-class pack at 40% off',
        category: 'wellness',
        offerText: '40% off',
        originalPrice: 6000,
        offerPrice: 3600,
        totalQuantity: 20,
        expiresIn: 3 * 24 * HOUR,
      },
      {
        title: 'Sunrise yoga in the park',
        category: 'experiences',
        offerText: 'Pay what you want',
        expiresIn: 18 * HOUR,
        lootType: 'experience',
      },
    ],
  },
  {
    phone: '+919999900004',
    username: 'demo_threadloom',
    businessName: 'Thread & Loom',
    category: 'retail_store',
    about: 'Handwoven cottons and indie labels.',
    branch: { name: 'CMH Road', address: 'CMH Rd, Indiranagar', latitude: 12.9786, longitude: 77.6366 },
    loot: [
      {
        title: 'Flash sale: kurtas at ₹499',
        category: 'retail',
        offerText: 'Flat ₹499',
        originalPrice: 1299,
        offerPrice: 499,
        totalQuantity: 3,
        expiresIn: 30 * MIN,
        lootType: 'flash',
      },
      {
        title: 'Free tote with any purchase',
        category: 'retail',
        offerText: 'Free tote bag',
        totalQuantity: 50,
        expiresIn: 8 * HOUR,
      },
      {
        title: 'Weekend block-print market',
        category: 'flash_commerce',
        offerText: '15% off everything',
        expiresIn: 2 * 24 * HOUR,
        lootType: 'drop',
      },
    ],
  },
]

async function upsertUser(phoneNumber, fields) {
  return User.findOneAndUpdate(
    { phoneNumber },
    { $set: fields, $setOnInsert: { phoneNumber } },
    { upsert: true, returnDocument: 'after' },
  )
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 })
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
  const dbName = mongoose.connection.db.databaseName
  console.log(`Seeding database "${dbName}"`)

  const hunter = await upsertUser(HUNTER_PHONE, { name: 'Demo Hunter', accountType: 'personal' })

  // Remove previous demo businesses' loot and every engagement with it.
  const demoBusinesses = await Business.find({ username: { $in: BUSINESSES.map((b) => b.username) } })
  const oldLoot = await Loot.find({ businessId: { $in: demoBusinesses.map((b) => b._id) } }).select('_id')
  const oldLootIds = oldLoot.map((l) => l._id)
  await Promise.all([
    Claim.deleteMany({ lootId: { $in: oldLootIds } }),
    Save.deleteMany({ lootId: { $in: oldLootIds } }),
    Claim.deleteMany({ userId: hunter._id }),
    Save.deleteMany({ userId: hunter._id }),
    Follow.deleteMany({ userId: hunter._id }),
    Loot.deleteMany({ _id: { $in: oldLootIds } }),
  ])
  await User.updateOne({ _id: hunter._id }, { savesCount: 0, claimsCount: 0, followingCount: 0 })

  const now = Date.now()
  let lootCount = 0
  for (const spec of BUSINESSES) {
    const owner = await upsertUser(spec.phone, { name: `${spec.businessName} (owner)`, accountType: 'professional' })
    const business = await Business.findOneAndUpdate(
      { username: spec.username },
      {
        $set: {
          ownerUserId: owner._id,
          businessName: spec.businessName,
          category: spec.category,
          about: spec.about,
          logo: `https://picsum.photos/seed/${spec.username}-logo/200/200`,
          branches: [toBranchFields(spec.branch)],
          followersCount: 0,
          totalClaimsCount: 0,
        },
      },
      { upsert: true, returnDocument: 'after' },
    )
    await User.updateOne({ _id: owner._id }, { businessId: business._id })

    const branch = business.branches[0]
    for (const [i, item] of spec.loot.entries()) {
      const { expiresIn, ...fields } = item
      const expiryAt = new Date(now + expiresIn)
      // Stagger publish times so Fresh and the freshness signal have something to sort.
      const publishedAt = new Date(now - (i * 3 + 1) * 17 * MIN)
      await Loot.create({
        ...fields,
        description: `${item.offerText} at ${spec.businessName}, ${spec.branch.name}. Show your code at the counter.`,
        media: image(`${spec.username}-${i}`),
        ...branchFields(branch),
        businessId: business._id,
        status: liveStatusFor(expiryAt, now),
        publishedAt,
        expiryAt,
        // Some engagement so the ranking has signal.
        saveCount: (i * 7 + spec.username.length) % 23,
        viewCount: 40 + i * 13,
        shareCount: i % 3,
      })
      lootCount++
    }
  }

  console.log(`Seeded ${BUSINESSES.length} businesses and ${lootCount} live loot near ${geoHash(12.9719, 77.6412, 5)}.`)
  console.log('\nSign in with (OTP appears in the API log):')
  console.log(`  hunter    ${HUNTER_PHONE}`)
  for (const b of BUSINESSES) console.log(`  business  ${b.phone}  @${b.username}`)
  console.log('\nFeed location: Indiranagar, Bengaluru (12.9719, 77.6412).')
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
