/**
 * ControlFlagsHistoryTable operations
 *
 * PartitionKey = controlName
 * RowKey       = `${zeroPadded(version)}_${timestamp}` — sorts chronologically
 */
import { historyClient, ensureTables } from './azure-tables'
import type { ControlFlagHistory, FlagStatus } from '@types'

// ── Internal helpers ──────────────────────────────────────────────────────────

type HistoryEntity = {
  partitionKey: string   // controlName
  rowKey: string         // version_timestamp
  controlName: string
  capabilityName: string
  version: number
  state: boolean
  status: string
  updatedBy: string
  updatedAt: string
  changeDescription: string
}

function entityToHistory(e: HistoryEntity): ControlFlagHistory {
  return {
    controlName: e.controlName,
    capabilityName: e.capabilityName,
    version: e.version,
    state: e.state,
    status: e.status as FlagStatus,
    updatedBy: e.updatedBy,
    updatedAt: e.updatedAt,
    changeDescription: e.changeDescription,
  }
}

/** Pad version so lexicographic sort == numeric sort (up to 9999 versions) */
function rowKey(version: number): string {
  return `${String(version).padStart(6, '0')}_${Date.now()}`
}

// ── Boot: ensure tables exist ─────────────────────────────────────────────────

let _ready: Promise<void> | null = null
function ready() {
  if (!_ready) _ready = ensureTables()
  return _ready
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Append a history entry after a flag change */
export async function addHistoryEntry(
  entry: ControlFlagHistory,
): Promise<ControlFlagHistory> {
  await ready()
  const entity: HistoryEntity = {
    partitionKey: entry.controlName,
    rowKey: rowKey(entry.version),
    controlName: entry.controlName,
    capabilityName: entry.capabilityName,
    version: entry.version,
    state: entry.state,
    status: entry.status,
    updatedBy: entry.updatedBy,
    updatedAt: entry.updatedAt,
    changeDescription: entry.changeDescription,
  }
  await historyClient().createEntity(entity)
  return entry
}

/** Retrieve all history entries for a specific control flag (newest first) */
export async function getHistory(
  controlName: string,
): Promise<ControlFlagHistory[]> {
  await ready()
  const entries: ControlFlagHistory[] = []
  const iter = historyClient().listEntities<HistoryEntity>({
    queryOptions: { filter: `PartitionKey eq '${controlName}'` },
  })
  for await (const entity of iter) entries.push(entityToHistory(entity))
  // Sort descending by version (highest version = most recent first)
  return entries.sort((a, b) => b.version - a.version)
}

/** Retrieve history for every flag across all capabilities (newest first) */
export async function getAllHistory(): Promise<ControlFlagHistory[]> {
  await ready()
  const entries: ControlFlagHistory[] = []
  const iter = historyClient().listEntities<HistoryEntity>()
  for await (const entity of iter) entries.push(entityToHistory(entity))
  return entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** Retrieve history for all flags of a given capability */
export async function getHistoryByCapability(
  capabilityName: string,
): Promise<ControlFlagHistory[]> {
  await ready()
  const entries: ControlFlagHistory[]= []
  const iter = historyClient().listEntities<HistoryEntity>({
    queryOptions: { filter: `capabilityName eq '${capabilityName}'` },
  })
  for await (const entity of iter) entries.push(entityToHistory(entity))
  return entries.sort((a, b) => b.version - a.version)
}
