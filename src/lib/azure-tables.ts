/**
 * Azure Tables client factory
 *
 * AZURE_TABLES_ENV=local  → Azurite via connection string (VS Code extension)
 * AZURE_TABLES_ENV=azure  → Real Azure via Service Principal
 *                           (AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET)
 */
import { TableClient, TableServiceClient } from '@azure/data-tables'
import { ClientSecretCredential } from '@azure/identity'
import { env } from '@config/env'

export const TABLE_FLAGS = 'ControlFlagsTable'
export const TABLE_HISTORY = 'ControlFlagsHistoryTable'

function getAccountUrl(): string {
  return env.AZURE_STORAGE_ACCOUNT_URL
}

function getServicePrincipal(): ClientSecretCredential {
  return new ClientSecretCredential(
    env.AZURE_TENANT_ID,
    env.AZURE_CLIENT_ID,
    env.AZURE_CLIENT_SECRET,
  )
}

function getTableClient(tableName: string): TableClient {
  if (env.AZURE_TABLES_ENV === 'local') {
    return TableClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING, tableName)
  }
  return new TableClient(getAccountUrl(), tableName, getServicePrincipal())
}

function getServiceClient(): TableServiceClient {
  if (env.AZURE_TABLES_ENV === 'local') {
    return TableServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING)
  }
  return new TableServiceClient(getAccountUrl(), getServicePrincipal())
}

/** Creates both tables if they don't already exist. Safe to call on every boot. */
export async function ensureTables(): Promise<void> {
  const svc = getServiceClient()
  await Promise.all([
    svc.createTable(TABLE_FLAGS).catch(() => {}),
    svc.createTable(TABLE_HISTORY).catch(() => {}),
  ])
}

/** Lazily-initialised singleton clients */
let _flagsClient: TableClient | null = null
let _historyClient: TableClient | null = null

export function flagsClient(): TableClient {
  if (!_flagsClient) _flagsClient = getTableClient(TABLE_FLAGS)
  return _flagsClient
}

export function historyClient(): TableClient {
  if (!_historyClient) _historyClient = getTableClient(TABLE_HISTORY)
  return _historyClient
}
