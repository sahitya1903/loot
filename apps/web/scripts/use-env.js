// Copies .env.<name> to .env.local so `next dev` picks it up.
// Usage: node scripts/use-env.js dev|staging|prod
// Plain Node instead of `cp` so the npm scripts also work in Windows cmd.

import { copyFileSync, existsSync } from 'node:fs'

const name = process.argv[2]
const source = `.env.${name}`

if (!existsSync(source)) {
  if (name !== 'dev') {
    console.error(`${source} not found — ask the team for it.`)
    process.exit(1)
  }
  // First run: start from the template, which points at the local API.
  copyFileSync('.env.example', source)
  console.log(`Created ${source} from .env.example`)
}

copyFileSync(source, '.env.local')
console.log(`Using ${source}`)
