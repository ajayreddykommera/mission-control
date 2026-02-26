/**
 * ControlFlagsTable operations
 *
 * PartitionKey = capabilityName
 * RowKey       = controlName
 */
import { flagsClient, ensureTables } from './azure-tables'
import type { ControlFlag, FlagStatus } from '@types'

// ── Internal helpers ──────────────────────────────────────────────────────────

type TableEntity = {
  partitionKey: string
  rowKey: string
  label: string
  description: string
  state: boolean
  status: string
  updatedBy: string
  lastUpdatedAt: string
  version: number
}

function entityToFlag(e: TableEntity): ControlFlag {
  return {
    capabilityName: e.partitionKey,
    controlName: e.rowKey,
    label: e.label,
    description: e.description,
    state: e.state,
    status: e.status as FlagStatus,
    updatedBy: e.updatedBy,
    lastUpdatedAt: e.lastUpdatedAt,
    version: e.version,
  }
}

function flagToEntity(flag: ControlFlag): TableEntity {
  return {
    partitionKey: flag.capabilityName,
    rowKey: flag.controlName,
    label: flag.label,
    description: flag.description,
    state: flag.state,
    status: flag.status,
    updatedBy: flag.updatedBy,
    lastUpdatedAt: flag.lastUpdatedAt,
    version: flag.version,
  }
}

// ── Boot: ensure tables exist ─────────────────────────────────────────────────

let _ready: Promise<void> | null = null
function ready() {
  if (!_ready) _ready = ensureTables()
  return _ready
}

// ── Public API ────────────────────────────────────────────────────────────────

/** List all control flags across all capabilities */
export async function getAllFlags(): Promise<ControlFlag[]> {
  await ready()
  const client = flagsClient()
  const flags: ControlFlag[] = []
  const iter = client.listEntities<TableEntity>()
  for await (const entity of iter) {
    flags.push(entityToFlag(entity))
  }
  return flags
}

/** List flags filtered by capability */
export async function getFlagsByCapability(
  capabilityName: string,
): Promise<ControlFlag[]> {
  await ready()
  const flags: ControlFlag[] = []
  const iter = flagsClient().listEntities<TableEntity>({
    queryOptions: { filter: `PartitionKey eq '${capabilityName}'` },
  })
  for await (const entity of iter) flags.push(entityToFlag(entity))
  return flags
}

/** Get a single flag */
export async function getFlag(
  capabilityName: string,
  controlName: string,
): Promise<ControlFlag | null> {
  await ready()
  try {
    const entity = await flagsClient().getEntity<TableEntity>(
      capabilityName,
      controlName,
    )
    return entityToFlag(entity)
  } catch (err: any) {
    if (err?.statusCode === 404) return null
    throw err
  }
}

/** Create or fully replace a flag */
export async function upsertFlag(flag: ControlFlag): Promise<ControlFlag> {
  await ready()
  await flagsClient().upsertEntity(flagToEntity(flag), 'Replace')
  return flag
}

/** Toggle state; bumps version */
export async function toggleFlag(
  capabilityName: string,
  controlName: string,
  updatedBy: string,
): Promise<ControlFlag | null> {
  const flag = await getFlag(capabilityName, controlName)
  if (!flag) return null
  flag.state = !flag.state
  flag.version += 1
  flag.lastUpdatedAt = new Date().toISOString()
  flag.updatedBy = updatedBy
  return upsertFlag(flag)
}

/** Explicitly set state */
export async function setFlagState(
  capabilityName: string,
  controlName: string,
  state: boolean,
  updatedBy: string,
): Promise<ControlFlag | null> {
  const flag = await getFlag(capabilityName, controlName)
  if (!flag) return null
  if (flag.state === state) return flag
  flag.state = state
  flag.version += 1
  flag.lastUpdatedAt = new Date().toISOString()
  flag.updatedBy = updatedBy
  return upsertFlag(flag)
}

/** Update label / description / status */
export async function updateFlagMeta(
  capabilityName: string,
  controlName: string,
  patch: Partial<Pick<ControlFlag, 'label' | 'description' | 'status'>>,
  updatedBy: string,
): Promise<ControlFlag | null> {
  const flag = await getFlag(capabilityName, controlName)
  if (!flag) return null
  Object.assign(flag, patch)
  flag.version += 1
  flag.lastUpdatedAt = new Date().toISOString()
  flag.updatedBy = updatedBy
  return upsertFlag(flag)
}

/** Delete a flag */
export async function deleteFlag(
  capabilityName: string,
  controlName: string,
): Promise<boolean> {
  await ready()
  try {
    await flagsClient().deleteEntity(capabilityName, controlName)
    return true
  } catch (err: any) {
    if (err?.statusCode === 404) return false
    throw err
  }
}
