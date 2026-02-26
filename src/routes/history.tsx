import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Typography,
  Flex,
  Select,
  Input,
  Table,
  Timeline,
  Tag,
  Spin,
  Alert,
  Tooltip,
  Empty,
  Badge,
} from 'antd'
import {
  HistoryOutlined,
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  BranchesOutlined,
} from '@ant-design/icons'
import { apiFetch } from '@utils/api'
import { useFlags } from '@hooks/useFlags'
import type { ControlFlagHistory } from '@types'

export const Route = createFileRoute('/history')({ component: FlagsHistory })

const { Title, Text } = Typography

// ── Data hooks ────────────────────────────────────────────────────────────────

function useAllHistory() {
  return useQuery({
    queryKey: ['history', 'all'],
    queryFn: () =>
      apiFetch<{ history: ControlFlagHistory[] }>('/api/flags/history').then(
        (d) => d.history,
      ),
    staleTime: 30_000,
  })
}

function useFlagHistory(
  capabilityName: string,
  controlName: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['history', capabilityName, controlName],
    queryFn: () =>
      apiFetch<{ history: ControlFlagHistory[] }>(
        `/api/flags/${capabilityName}/${controlName}/history`,
      ).then((d) => d.history),
    enabled,
    staleTime: 30_000,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stateTag(state: boolean) {
  return state ? (
    <Tag color="success" style={{ fontWeight: 600, minWidth: 38, textAlign: 'center' }}>
      ON
    </Tag>
  ) : (
    <Tag color="error" style={{ fontWeight: 600, minWidth: 38, textAlign: 'center' }}>
      OFF
    </Tag>
  )
}

function statusTag(status: string) {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    deleted: 'red',
  }
  return (
    <Tag color={colors[status] ?? 'default'} style={{ textTransform: 'capitalize' }}>
      {status}
    </Tag>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── Component ─────────────────────────────────────────────────────────────────

function FlagsHistory() {
  const { flags } = useFlags()
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null) // "capabilityName::controlName"
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  const selectedParts = selectedFlag ? selectedFlag.split('::') : null
  const selectedCapability = selectedParts?.[0] ?? ''
  const selectedControl = selectedParts?.[1] ?? ''

  const allHistoryQuery = useAllHistory()
  const flagHistoryQuery = useFlagHistory(
    selectedCapability,
    selectedControl,
    !!selectedFlag,
  )

  const activeData: ControlFlagHistory[] = selectedFlag
    ? (flagHistoryQuery.data ?? [])
    : (allHistoryQuery.data ?? [])

  const isLoading = selectedFlag ? flagHistoryQuery.isLoading : allHistoryQuery.isLoading
  const error = selectedFlag ? flagHistoryQuery.error : allHistoryQuery.error

  const filteredData = useMemo(() => {
    if (!search) return activeData
    const q = search.toLowerCase()
    return activeData.filter(
      (h) =>
        h.controlName.toLowerCase().includes(q) ||
        h.capabilityName.toLowerCase().includes(q) ||
        h.changeDescription.toLowerCase().includes(q) ||
        h.updatedBy.toLowerCase().includes(q),
    )
  }, [activeData, search])

  const flagOptions = useMemo(
    () =>
      flags.map((f) => ({
        value: `${f.capabilityName}::${f.controlName}`,
        label: f.controlName,
        capabilityName: f.capabilityName,
        controlName: f.controlName,
      })),
    [flags],
  )

  // ── All-flags Table columns ───────────────────────────────────────────────

  const allColumns = [
    {
      key: 'flag',
      title: 'Flag',
      width: 240,
      render: (_: unknown, r: ControlFlagHistory) => (
        <Flex vertical gap={2}>
          <Text
            strong
            style={{
              fontFamily: "'SF Mono','Fira Code','Cascadia Code','Consolas',monospace",
              fontSize: 13,
              color: '#1f2d5c',
            }}
          >
            {r.controlName}
          </Text>
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#6e7f9d',
            }}
          >
            {r.capabilityName}
          </Text>
        </Flex>
      ),
    },
    {
      key: 'version',
      title: 'Ver.',
      width: 72,
      render: (_: unknown, r: ControlFlagHistory) => (
        <Badge
          count={`v${r.version}`}
          style={{
            backgroundColor: '#e6f4ff',
            color: '#1677ff',
            fontWeight: 600,
            fontSize: 11,
            boxShadow: 'none',
          }}
        />
      ),
    },
    {
      key: 'change',
      title: 'Change Description',
      dataIndex: 'changeDescription',
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {v}
        </Text>
      ),
    },
    {
      key: 'state',
      title: 'State',
      width: 80,
      render: (_: unknown, r: ControlFlagHistory) => stateTag(r.state),
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (_: unknown, r: ControlFlagHistory) => statusTag(r.status),
    },
    {
      key: 'by',
      title: 'Updated By',
      dataIndex: 'updatedBy',
      width: 190,
      render: (v: string) => (
        <Flex align="center" gap={6}>
          <UserOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 12 }}>{v}</Text>
        </Flex>
      ),
    },
    {
      key: 'when',
      title: 'When',
      dataIndex: 'updatedAt',
      width: 130,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString()}>
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {relativeTime(v)}
            </Text>
          </Flex>
        </Tooltip>
      ),
    },
  ]

  // ── Per-flag Timeline items ───────────────────────────────────────────────

  const timelineItems = filteredData.map((entry, i) => ({
    key: i,
    color: entry.state ? '#389e0d' : '#cf1322',
    dot: entry.state ? (
      <CheckCircleOutlined style={{ fontSize: 15, color: '#389e0d' }} />
    ) : (
      <StopOutlined style={{ fontSize: 15, color: '#cf1322' }} />
    ),
    children: (
      <Flex
        vertical
        gap={6}
        style={{
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 8,
        }}
      >
        <Flex align="center" gap={8} wrap="wrap">
          <Badge
            count={`v${entry.version}`}
            style={{
              backgroundColor: '#e6f4ff',
              color: '#1677ff',
              fontWeight: 600,
              fontSize: 11,
              boxShadow: 'none',
            }}
          />
          {stateTag(entry.state)}
          {statusTag(entry.status)}
          <Tooltip title={new Date(entry.updatedAt).toLocaleString()}>
            <Flex align="center" gap={4}>
              <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {relativeTime(entry.updatedAt)}
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
        <Text style={{ fontSize: 13.5, color: '#1a1a2e' }}>
          {entry.changeDescription}
        </Text>
        <Flex align="center" gap={6}>
          <UserOutlined style={{ color: '#8c8c8c', fontSize: 11 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {entry.updatedBy}
          </Text>
        </Flex>
      </Flex>
    ),
  }))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Flags History
          </Title>
          <Text type="secondary">
            Audit log of all flag state and metadata changes
          </Text>
        </div>
      </Flex>

      {/* Controls */}
      <Flex gap={12} align="center" style={{ marginBottom: 20 }} wrap="wrap">
        <Select
          placeholder={
            <Flex align="center" gap={6}>
              <BranchesOutlined style={{ color: '#8c8c8c' }} />
              <span>All flags</span>
            </Flex>
          }
          allowClear
          showSearch
          style={{ width: 300 }}
          value={selectedFlag}
          onChange={(v) => {
            setSelectedFlag(v ?? null)
            setSearch('')
            setCurrentPage(1)
          }}
          filterOption={(input, option) =>
            String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionRender={(option) => (
            <Flex vertical gap={1}>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
                  fontWeight: 600,
                  color: '#1f2d5c',
                }}
              >
                {(option.data as { controlName: string }).controlName}
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {(option.data as { capabilityName: string }).capabilityName}
              </Text>
            </Flex>
          )}
          options={flagOptions}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          placeholder="Search changes, users…"
          allowClear
          style={{ width: 260 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
        {!isLoading && filteredData.length > 0 && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'}
          </Text>
        )}
      </Flex>

      {error && (
        <Alert
          type="error"
          message="Failed to load history"
          description={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isLoading ? (
        <Flex justify="center" style={{ paddingTop: 80 }}>
          <Spin size="large" />
        </Flex>
      ) : filteredData.length === 0 ? (
        <Empty
          image={<HistoryOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
          imageStyle={{ height: 64 }}
          description="No history entries found"
        />
      ) : selectedFlag ? (
        // ── Per-flag Timeline ────────────────────────────────────────────────
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
            padding: '28px 36px',
          }}
        >
          <Flex align="center" gap={10} style={{ marginBottom: 24 }}>
            <HistoryOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <Text
              strong
              style={{
                fontSize: 15,
                fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
                color: '#1f2d5c',
              }}
            >
              {selectedControl}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              {selectedCapability}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              · {filteredData.length} {filteredData.length === 1 ? 'change' : 'changes'}
            </Text>
          </Flex>
          <Timeline mode="left" items={timelineItems} />
        </div>
      ) : (
        // ── All-flags Table ──────────────────────────────────────────────────
        <Table<ControlFlagHistory>
          rowKey={(r) => `${r.controlName}_v${r.version}_${r.updatedAt}`}
          dataSource={filteredData}
          columns={allColumns}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (t) => `${t} entries`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
          size="middle"
          bordered
        />
      )}
    </div>
  )
}
