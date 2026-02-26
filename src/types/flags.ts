// ─────────────────────────────────────────────────────────────────────────────
// Feature flag domain types
// ─────────────────────────────────────────────────────────────────────────────

/** Lifecycle status of a control flag */
export type FlagStatus = 'active' | 'inactive' | 'deleted'

// ── ControlFlagsTable ────────────────────────────────────────────────────────
// PartitionKey = capabilityName
// RowKey       = controlName

export interface ControlFlag {
  /** Azure Table partition key — groups flags by capability */
  capabilityName: string
  /** Azure Table row key — unique name of the control within a capability */
  controlName: string
  /** Human-readable label shown in the UI */
  label: string
  /** Description of what this flag does */
  description: string
  /** Toggle state — true = enabled, false = disabled */
  state: boolean
  /** Lifecycle status */
  status: FlagStatus
  /** Identity (email / UPN / service principal) that last changed this flag */
  updatedBy: string
  /** ISO-8601 timestamp of the last update */
  lastUpdatedAt: string
  /** Monotonically increasing version counter for optimistic concurrency */
  version: number
}

// ── ControlFlagsHistoryTable ─────────────────────────────────────────────────
// PartitionKey = controlName
// RowKey       = `${version}_${timestamp}` — ensures chronological order per flag

export interface ControlFlagHistory {
  /** Control flag this entry belongs to */
  controlName: string
  /** Capability this flag belongs to */
  capabilityName: string
  /** Version of the flag after the change */
  version: number
  /** Toggle state at the time of the change */
  state: boolean
  /** Lifecycle status at the time of the change */
  status: FlagStatus
  /** Who made the change */
  updatedBy: string
  /** When the change was made (ISO-8601) */
  updatedAt: string
  /** Human-readable description of what changed */
  changeDescription: string
}

// ── PublicFlag ───────────────────────────────────────────────────────────────
// Minimal projection returned by the public /api/public/flags/* endpoints.
// Only active flags are ever included; sensitive operational fields are omitted.

export interface PublicFlag {
  /** Capability group this flag belongs to */
  capabilityName: string
  /** Unique name of the control within a capability */
  controlName: string
  /** Human-readable label */
  label: string
  /** Toggle state — true = enabled, false = disabled */
  state: boolean
  /** Monotonically increasing version counter */
  version: number
}
