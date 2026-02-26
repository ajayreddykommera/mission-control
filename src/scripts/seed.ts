/**
 * Seed script — populates ControlFlagsTable and ControlFlagsHistoryTable
 * with an initial set of flags for local development.
 *
 * Usage (with Azurite VS Code extension running):
 *   pnpm seed
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Minimal .env file parser (avoids a dotenv dependency)
function loadEnv(file: string) {
  try {
    const lines = readFileSync(resolve(process.cwd(), file), 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // file absent — skip
  }
}
loadEnv('.env.local')
loadEnv('.env')

import { upsertFlag } from '../lib/flags-store'
import { addHistoryEntry } from '../lib/flags-history-store'
import { ensureTables } from '../lib/azure-tables'
import type { ControlFlag } from '../types'

const now = new Date().toISOString()

const seedFlags: ControlFlag[] = [
  {
    capabilityName: 'core',
    controlName: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Take the application offline for maintenance',
    state: false,
    status: 'active',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
  {
    capabilityName: 'core',
    controlName: 'dark_mode',
    label: 'Dark Mode',
    description: 'Enable dark mode UI theme for all users',
    state: false,
    status: 'active',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
  {
    capabilityName: 'dashboard',
    controlName: 'new_dashboard',
    label: 'New Dashboard',
    description: 'Enable the redesigned mission-control dashboard',
    state: true,
    status: 'draft',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
  {
    capabilityName: 'dashboard',
    controlName: 'analytics_v2',
    label: 'Analytics v2',
    description: 'Use the new high-performance analytics engine',
    state: true,
    status: 'active',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
  {
    capabilityName: 'ai',
    controlName: 'ai_suggestions',
    label: 'AI Suggestions',
    description: 'Show AI-powered suggestions and auto-complete',
    state: false,
    status: 'draft',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
  {
    capabilityName: 'ai',
    controlName: 'beta_features',
    label: 'Beta Features',
    description: 'Unlock all beta features for early adopters',
    state: false,
    status: 'active',
    updatedBy: 'seed',
    lastUpdatedAt: now,
    version: 1,
  },
]

async function seed() {
  console.log('🔧  Ensuring tables exist…')
  await ensureTables()

  console.log(`🌱  Seeding ${seedFlags.length} flags…\n`)
  for (const flag of seedFlags) {
    await upsertFlag(flag)
    await addHistoryEntry({
      controlName: flag.controlName,
      capabilityName: flag.capabilityName,
      version: flag.version,
      state: flag.state,
      status: flag.status,
      updatedBy: 'seed',
      updatedAt: now,
      changeDescription: 'Initial seed',
    })
    console.log(
      `  ✅  [${flag.capabilityName}] ${flag.controlName}  →  ${flag.state ? 'ON' : 'OFF'}`,
    )
  }
  console.log('\n✨  Seed complete.')
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message ?? err)
  process.exit(1)
})
