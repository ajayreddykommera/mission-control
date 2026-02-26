import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  Switch,
  Tag,
  Button,
  Input,
  Typography,
  Space,
  Card,
  Alert,
  Tooltip,
  Spin,
  Drawer,
  Form,
  Select,
  Popconfirm,
  Divider,
  Flex,
  Tabs,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  StopOutlined,
  PlusOutlined,
  FlagOutlined,
  PoweroffOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useFlags, useToggleFlag, useUpdateFlag, useDeleteFlag, useCreateFlag } from '@hooks/useFlags'
import type { ControlFlag } from '@types'

// ── Loading spinner shown while the route loader fetches data ─────────────
function LoadingSpinner() {
  return (
    <Flex vertical align="center" justify="center" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <Spin size="large" />
    </Flex>
  )
}

export const Route = createFileRoute('/')({ component: FlagsDashboard })

const { Title, Text } = Typography

// ── Column helper ─────────────────────────────────────────────────────────
const col = createColumnHelper<ControlFlag>()

const columns = [
  col.accessor('label', {
    header: 'Label',
    cell: (info) => <Text strong>{info.getValue()}</Text>,
  }),
  col.accessor('description', {
    header: 'Description',
    cell: (info) => (
      <Text type="secondary" style={{ maxWidth: 280, display: 'inline-block' }}>
        {info.getValue()}
      </Text>
    ),
    enableSorting: false,
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const val = info.getValue()
      const config: Record<string, { color: string; dot: string; label: string }> = {
        active:   { color: 'green',   dot: '#389e0d', label: 'Active' },
        inactive: { color: 'default', dot: '#faad14', label: 'Inactive' },
        deleted:  { color: 'red',     dot: '#cf1322', label: 'Deleted' },
      }
      const { color, dot, label } = config[val] ?? { color: 'default', dot: '#d9d9d9', label: val }
      return (
        <Tag color={color} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
          {label}
        </Tag>
      )
    },
  }),
  col.accessor('lastUpdatedAt', {
    header: 'Last Updated',
    cell: (info) => (
      <Tooltip title={new Date(info.getValue()).toISOString()}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(info.getValue()).toLocaleString()}
        </Text>
      </Tooltip>
    ),
  }),
]

// ── Dashboard component ───────────────────────────────────────────────────
function FlagsDashboard() {
  // isMounted flips true after the first client render, by which point
  // antd has injected all styles. Holding the spinner until both
  // isMounted && !isLoading guarantees the user never sees a flash of
  // unstyled or empty content.
  const [isMounted, setIsMounted] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => { setIsMounted(true) }, [])

  // Debounce search: update the table filter 200ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setGlobalFilter(searchText), 200)
    return () => clearTimeout(t)
  }, [searchText])

  const { flags, isLoading, error } = useFlags()
  const toggleFlag = useToggleFlag()
  const updateFlag = useUpdateFlag()
  const deleteFlag = useDeleteFlag()
  const createFlag = useCreateFlag()

  const [viewFlag, setViewFlag] = useState<ControlFlag | null>(null)
  const [editFlag, setEditFlag] = useState<ControlFlag | null>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const editStateValue = Form.useWatch('state', editForm)
  const createStateValue = Form.useWatch('state', createForm)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all')
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tablePage, setTablePage] = useState(1)

  const tabData = statusFilter === 'all' ? flags : flags.filter((f) => f.status === statusFilter)

  const loading = !isMounted || isLoading

  const table = useReactTable({
    data: tabData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Build antd column config from TanStack column headers
  const antColumns = useMemo(
    () =>
      table.getFlatHeaders().map((header) => ({
        key: header.id,
        title: flexRender(header.column.columnDef.header, header.getContext()),
        dataIndex: header.id,
        sorter: header.column.getCanSort() ? true : undefined,
        sortOrder:
          header.column.getIsSorted() === 'asc'
            ? ('ascend' as const)
            : header.column.getIsSorted() === 'desc'
              ? ('descend' as const)
              : null,
        onHeaderCell: () => ({
          onClick: header.column.getCanSort()
            ? header.column.getToggleSortingHandler()
            : undefined,
        }),
        render: (_: unknown, record: ControlFlag) => {
          const row = table
            .getRowModel()
            .rows.find((r) => r.original === record)
          if (!row) return null
          const cell = row.getVisibleCells().find((c) => c.column.id === header.id)
          if (!cell) return null
          return flexRender(cell.column.columnDef.cell, cell.getContext())
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, sorting],
  )

  // Flag column — combined Switch + control name + capability name
  const flagColumn = {
    key: 'flag',
    title: 'Flag',
    fixed: 'left' as const,
    width: 270,
    render: (_: unknown, record: ControlFlag) => (
      <Flex align="center" gap={12}>
        <Popconfirm
          title={record.state ? 'Turn this flag OFF?' : 'Turn this flag ON?'}
          description={
            record.state
              ? `Disabling "${record.controlName}" will turn off this feature for all users.`
              : `Enabling "${record.controlName}" will activate this feature for all users.`
          }
          okText={record.state ? 'Turn OFF' : 'Turn ON'}
          cancelText="Cancel"
          okButtonProps={{ danger: record.state }}
          disabled={record.status === 'deleted'}
          onConfirm={() =>
            toggleFlag.mutate({
              capabilityName: record.capabilityName,
              controlName: record.controlName,
            })
          }
        >
          <Switch
            checked={record.state}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            disabled={record.status === 'deleted'}
            loading={
              toggleFlag.isPending &&
              toggleFlag.variables?.capabilityName === record.capabilityName &&
              toggleFlag.variables?.controlName === record.controlName
            }
            style={{
              backgroundColor: record.status === 'deleted' ? undefined : record.state ? '#389e0d' : '#cf1322',
              minWidth: 54,
            }}
          />
        </Popconfirm>
        <Flex vertical gap={2} style={{ minWidth: 0, overflow: 'hidden' }}>
          <Text
            strong
            ellipsis
            style={{
              fontSize: 13.5,
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              letterSpacing: '-0.2px',
              lineHeight: 1.35,
              color: '#1f2d5c',
            }}
          >
            {record.controlName}
          </Text>
          <Text
            ellipsis
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              lineHeight: 1.3,
              color: '#6e7f9d',
            }}
          >
            {record.capabilityName}
          </Text>
        </Flex>
      </Flex>
    ),
  }

  // Action column — view / edit / delete
  const actionColumn = {
    key: 'action',
    title: 'Actions',
    fixed: 'right' as const,
    width: 100,
    render: (_: unknown, record: ControlFlag) => (
      <Space size={4}>
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: '#1677ff' }} />}
            onClick={() => setViewFlag(record)}
          />
        </Tooltip>
        <Tooltip title={record.status === 'deleted' ? 'Cannot edit a deleted flag' : 'Edit'}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: record.status === 'deleted' ? undefined : '#d48806' }} />}
            disabled={record.status === 'deleted'}
            onClick={() => {
              setEditFlag(record)
              editForm.setFieldsValue({
                label: record.label,
                description: record.description,
                status: record.status,
                state: record.state,
              })
            }}
          />
        </Tooltip>
        <Tooltip title={record.status === 'deleted' ? 'Already deleted' : 'Delete'}>
          <Popconfirm
            disabled={record.status === 'deleted'}
            title={
              <Flex align="center" gap={8}>
                <DeleteOutlined style={{ color: '#cf1322' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Delete this flag?</span>
              </Flex>
            }
            description={
              <Flex vertical gap={8} style={{ maxWidth: 320, paddingTop: 4 }}>
                <span style={{ color: '#595959' }}>
                  You are about to permanently delete the flag{' '}
                  <strong style={{ color: '#1f2d5c', fontFamily: "'SF Mono','Fira Code','Consolas',monospace" }}>
                    {record.controlName}
                  </strong>{' '}
                  under capability{' '}
                  <strong style={{ color: '#6e7f9d', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>
                    {record.capabilityName}
                  </strong>.
                </span>
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  This will mark the flag as <Tag color="error" style={{ margin: 0 }}>Deleted</Tag> and it will no longer be active.
                </span>
              </Flex>
            }
            okText="Yes, delete it"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            overlayStyle={{ maxWidth: 380 }}
            onConfirm={() =>
              deleteFlag.mutate({
                capabilityName: record.capabilityName,
                controlName: record.controlName,
              })
            }
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.status === 'deleted'}
              loading={
                deleteFlag.isPending &&
                deleteFlag.variables?.capabilityName === record.capabilityName &&
                deleteFlag.variables?.controlName === record.controlName
              }
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    ),
  }

  const enabledCount  = flags.filter((f) => f.state && f.status !== 'deleted').length
  const activeCount   = flags.filter((f) => f.status === 'active').length
  const inactiveCount = flags.filter((f) => f.status === 'inactive').length
  const deletedCount  = flags.filter((f) => f.status === 'deleted').length

  // Hold until mounted (CSS ready) AND data is fetched
  if (loading) return <LoadingSpinner />

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Feature Flags
          </Title>
          <Text type="secondary">Mission Control · toggle features without deploying</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.resetFields()
            setCreateDrawerOpen(true)
          }}
        >
          Create Flag
        </Button>
      </Flex>

      {/* ── Stats ── */}
      {!isLoading && !error && (
        <Flex gap={16} style={{ marginBottom: 28 }}>
          {(
            [
              {
                label: 'Total Flags',
                value: flags.length,
                icon: <FlagOutlined style={{ fontSize: 18, color: '#1677ff' }} />,
                iconBg: '#e6f4ff',
                accent: '#1677ff',
                valueColor: '#1f2d5c',
              },
              {
                label: 'Active',
                value: activeCount,
                icon: <CheckCircleOutlined style={{ fontSize: 18, color: '#389e0d' }} />,
                iconBg: '#f6ffed',
                accent: '#52c41a',
                valueColor: '#389e0d',
              },
              {
                label: 'Inactive',
                value: inactiveCount,
                icon: <ExclamationCircleOutlined style={{ fontSize: 18, color: '#d48806' }} />,
                iconBg: '#fffbe6',
                accent: '#faad14',
                valueColor: '#d48806',
              },
              {
                label: 'Deleted',
                value: deletedCount,
                icon: <StopOutlined style={{ fontSize: 18, color: '#cf1322' }} />,
                iconBg: '#fff1f0',
                accent: '#ff4d4f',
                valueColor: '#cf1322',
              },
              {
                label: 'Enabled (ON)',
                value: enabledCount,
                icon: <PoweroffOutlined style={{ fontSize: 18, color: '#08979c' }} />,
                iconBg: '#e6fffb',
                accent: '#13c2c2',
                valueColor: '#08979c',
              },
            ] as { label: string; value: number; suffix?: string; icon: any; iconBg: string; accent: string; valueColor: string }[]
          ).map(({ label, value, suffix, icon, iconBg, accent, valueColor }) => (
            <Card
              key={label}
              size="small"
              style={{
                flex: 1,
                borderTop: `3px solid ${accent}`,
                borderRadius: 8,
                minWidth: 140,
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Flex justify="space-between" align="flex-start">
                <div>
                  <Text style={{ fontSize: 12, color: '#6e7f9d', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {label}
                  </Text>
                  <Flex align="baseline" gap={6} style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: valueColor }}>
                      {value}
                    </span>
                    {suffix && (
                      <Text style={{ fontSize: 13, color: '#adb5c7', fontWeight: 400 }}>
                        {suffix}
                      </Text>
                    )}
                  </Flex>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {/* ── Error ── */}
      {error && (
        <Alert type="error" message="Failed to load flags" description={error} showIcon style={{ marginBottom: 24 }} />
      )}

      {/* ── Search + Tabs + Table panel ── */}
      {!isLoading && !error && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {/* Search bar row */}
          <div style={{ padding: '20px 24px 0' }}>
            <Input
              placeholder="Search by flag name, capability, label…"
              prefix={<SearchOutlined style={{ color: searchText ? '#1677ff' : '#adb5c7', fontSize: 15, transition: 'color .2s' }} />}
              suffix={
                searchText ? (
                  <Flex align="center" gap={8}>
                    <Badge
                      count={table.getFilteredRowModel().rows.length}
                      color={table.getFilteredRowModel().rows.length === 0 ? '#ff4d4f' : '#1677ff'}
                      style={{ fontSize: 11 }}
                      overflowCount={999}
                      title={`${table.getFilteredRowModel().rows.length} match${table.getFilteredRowModel().rows.length === 1 ? '' : 'es'}`}
                    />
                  </Flex>
                ) : null
              }
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setTablePage(1)
              }}
              allowClear
              size="large"
              style={{
                borderRadius: 8,
                fontSize: 14,
                boxShadow: searchText ? '0 0 0 2px rgba(22, 119, 255, 0.08)' : undefined,
                transition: 'box-shadow .2s',
              }}
            />
            {searchText && table.getFilteredRowModel().rows.length === 0 && (
              <Flex align="center" gap={6} style={{ marginTop: 8, paddingLeft: 2 }}>
                <span style={{ fontSize: 13, color: '#ff4d4f' }}>
                  No flags match <strong>"{searchText}"</strong> — try a different keyword.
                </span>
              </Flex>
            )}
            {searchText && table.getFilteredRowModel().rows.length > 0 && (
              <Flex align="center" gap={6} style={{ marginTop: 8, paddingLeft: 2 }}>
                <span style={{ fontSize: 13, color: '#6e7f9d' }}>
                  Showing <strong style={{ color: '#1677ff' }}>{table.getFilteredRowModel().rows.length}</strong> of{' '}
                  <strong>{flags.length}</strong> flag{flags.length === 1 ? '' : 's'} matching{' '}
                  <strong>"{searchText}"</strong>
                </span>
              </Flex>
            )}
          </div>

          {/* Tabs */}
          <div style={{ padding: '0 24px' }}>
            <Tabs
              activeKey={statusFilter}
              onChange={(key) => {
                setStatusFilter(key as typeof statusFilter)
                setTablePage(1)
              }}
              style={{ marginBottom: 0 }}
              items={[
                { key: 'all',      label: `All (${flags.length})`,                                              icon: <AppstoreOutlined /> },
                { key: 'active',   label: `Active (${activeCount})`,                                            icon: <CheckCircleOutlined /> },
                { key: 'inactive', label: `Inactive (${inactiveCount})`,                                        icon: <MinusCircleOutlined /> },
                { key: 'deleted',  label: `Deleted (${deletedCount})`,                                          icon: <StopOutlined /> },
              ]}
            />
          </div>

          {/* Table — flush, no extra padding so borders extend edge-to-edge */}
          <Table<ControlFlag>
        rowKey={(r) => `${r.capabilityName}__${r.controlName}`}
        dataSource={table.getRowModel().rows.map((r) => r.original)}
        columns={[flagColumn, ...antColumns, actionColumn]}
        loading={isLoading}
        rowClassName={(r) => r.status === 'deleted' ? 'row-deleted' : ''}
        pagination={{
          current: tablePage,
          pageSize: tablePageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50'],
          showTotal: (t) => `${t} flags`,
          onChange: (page, size) => {
            setTablePage(page)
            setTablePageSize(size)
          },
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
        </div>
      )}

      <style>{`
        .row-deleted td { background-color: #fafafa !important; }
      `}</style>

      {/* ── View Drawer ── */}
      <Drawer
        title={
          viewFlag && (
            <Flex align="center" gap={10}>
              <Flex vertical gap={2}>
                <Text
                  strong
                  style={{
                    fontSize: 15,
                    fontFamily: "'SF Mono','Fira Code','Cascadia Code','Consolas',monospace",
                    color: '#1f2d5c',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {viewFlag.controlName}
                </Text>
                <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6e7f9d', fontWeight: 500 }}>
                  {viewFlag.capabilityName}
                </Text>
              </Flex>
            </Flex>
          )
        }
        open={!!viewFlag}
        onClose={() => setViewFlag(null)}
        width={520}
      >
        {viewFlag && (
          <Flex vertical gap={20}>

            {/* ── Hero state card ── */}
            <Flex
              align="center"
              justify="space-between"
              style={{
                background: viewFlag.state ? '#f6ffed' : '#fff2f0',
                border: `1px solid ${viewFlag.state ? '#b7eb8f' : '#ffccc7'}`,
                borderRadius: 10,
                padding: '16px 20px',
              }}
            >
              <Flex vertical gap={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current State</Text>
                <Text strong style={{ fontSize: 22, color: viewFlag.state ? '#389e0d' : '#cf1322' }}>
                  {viewFlag.state ? 'ON' : 'OFF'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{viewFlag.label}</Text>
              </Flex>
              <Flex vertical gap={6} align="flex-end">
                <Tag color={({ active: 'green', inactive: 'default', deleted: 'red' } as Record<string, string>)[viewFlag.status]} style={{ textTransform: 'capitalize', margin: 0 }}>
                  {viewFlag.status}
                </Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>v{viewFlag.version}</Text>
              </Flex>
            </Flex>

            {/* ── Description ── */}
            {viewFlag.description && (
              <Flex vertical gap={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</Text>
                <Text style={{ fontSize: 13.5, color: '#1a1a2e', lineHeight: 1.6 }}>{viewFlag.description}</Text>
              </Flex>
            )}

            <Divider style={{ margin: '4px 0' }} />

            {/* ── Identity ── */}
            <Flex vertical gap={12}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identity</Text>
              <Flex vertical gap={8}>
                <Flex align="center" justify="space-between"
                  style={{ background: '#f5f7fa', borderRadius: 6, padding: '8px 12px' }}>
                  <Flex vertical gap={1}>
                    <Text type="secondary" style={{ fontSize: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Control Name</Text>
                    <Typography.Text
                      copyable={{ tooltips: ['Copy', 'Copied!'] }}
                      style={{ fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 13, fontWeight: 600, color: '#1f2d5c' }}
                    >
                      {viewFlag.controlName}
                    </Typography.Text>
                  </Flex>
                </Flex>
                <Flex align="center" justify="space-between"
                  style={{ background: '#f5f7fa', borderRadius: 6, padding: '8px 12px' }}>
                  <Flex vertical gap={1}>
                    <Text type="secondary" style={{ fontSize: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Capability</Text>
                    <Typography.Text
                      copyable={{ tooltips: ['Copy', 'Copied!'] }}
                      style={{ fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 13, fontWeight: 600, color: '#6e7f9d' }}
                    >
                      {viewFlag.capabilityName}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            <Divider style={{ margin: '4px 0' }} />

            {/* ── Integration ── */}
            <Flex vertical gap={12}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Integration</Text>
              <Flex vertical gap={10}>

                <Flex vertical gap={4}>
                  <Text style={{ fontSize: 12, color: '#595959' }}>Check flag state (GET)</Text>
                  <Flex
                    align="center"
                    justify="space-between"
                    style={{ background: '#1a1a2e', borderRadius: 6, padding: '8px 14px' }}
                  >
                    <Typography.Text
                      copyable={{ tooltips: ['Copy', 'Copied!'], text: `/api/flags/${viewFlag.capabilityName}/${viewFlag.controlName}` }}
                      style={{ fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 11.5, color: '#a8d8a8' }}
                    >
                      {`GET /api/flags/${viewFlag.capabilityName}/${viewFlag.controlName}`}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            <Divider style={{ margin: '4px 0' }} />

            {/* ── Audit ── */}
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit</Text>
              <Flex justify="space-between">
                <Text type="secondary" style={{ fontSize: 12 }}>Last updated by</Text>
                <Text style={{ fontSize: 12 }}>{viewFlag.updatedBy}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary" style={{ fontSize: 12 }}>Last updated at</Text>
                <Tooltip title={new Date(viewFlag.lastUpdatedAt).toISOString()}>
                  <Text style={{ fontSize: 12 }}>{new Date(viewFlag.lastUpdatedAt).toLocaleString()}</Text>
                </Tooltip>
              </Flex>
            </Flex>

          </Flex>
        )}
      </Drawer>

      {/* ── Edit Drawer ── */}
      <Drawer
        title={`Edit — ${editFlag?.controlName}`}
        open={!!editFlag}
        onClose={() => { setEditFlag(null); editForm.resetFields() }}
        width={580}
        extra={
          <Space>
            <Popconfirm
              title={
                <Flex align="center" gap={8}>
                  <DeleteOutlined style={{ color: '#cf1322' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Delete this flag?</span>
                </Flex>
              }
              description={
                <Flex vertical gap={8} style={{ maxWidth: 320, paddingTop: 4 }}>
                  <span style={{ color: '#595959' }}>
                    You are about to permanently delete the flag{' '}
                    <strong style={{ color: '#1f2d5c', fontFamily: "'SF Mono','Fira Code','Consolas',monospace" }}>
                      {editFlag?.controlName}
                    </strong>{' '}
                    under capability{' '}
                    <strong style={{ color: '#6e7f9d', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>
                      {editFlag?.capabilityName}
                    </strong>.
                  </span>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                    This will mark the flag as <Tag color="error" style={{ margin: 0 }}>Deleted</Tag> and it will no longer be active.
                  </span>
                </Flex>
              }
              okText="Yes, delete it"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              overlayStyle={{ maxWidth: 380 }}
              onConfirm={() => {
                if (!editFlag) return
                deleteFlag.mutate(
                  { capabilityName: editFlag.capabilityName, controlName: editFlag.controlName },
                  { onSuccess: () => { setEditFlag(null); editForm.resetFields() } },
                )
              }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteFlag.isPending}
              >
                Delete
              </Button>
            </Popconfirm>
            <Button onClick={() => { setEditFlag(null); editForm.resetFields() }}>Cancel</Button>
            <Button
              type="primary"
              loading={updateFlag.isPending || toggleFlag.isPending}
              onClick={() =>
                editForm.validateFields().then((values) => {
                  if (!editFlag) return
                  const stateChanged = values.state !== editFlag.state
                  updateFlag.mutate(
                    {
                      capabilityName: editFlag.capabilityName,
                      controlName: editFlag.controlName,
                      label: values.label,
                      description: values.description,
                      status: values.status,
                    },
                    {
                      onSuccess: () => {
                        if (stateChanged) {
                          toggleFlag.mutate(
                            { capabilityName: editFlag.capabilityName, controlName: editFlag.controlName },
                            { onSuccess: () => { setEditFlag(null); editForm.resetFields() } },
                          )
                        } else {
                          setEditFlag(null)
                          editForm.resetFields()
                        }
                      },
                    },
                  )
                })
              }
            >
              Save
            </Button>
          </Space>
        }
        destroyOnClose
      >
        {editFlag && (
          <Form form={editForm} layout="vertical">
            <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Identity</Divider>
            <Form.Item label="Capability">
              <Input value={editFlag.capabilityName} disabled />
            </Form.Item>
            <Form.Item label="Control Name">
              <Input value={editFlag.controlName} disabled />
            </Form.Item>

            <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Metadata</Divider>
            <Form.Item name="label" label="Label" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="active">
                  <Flex align="center" gap={6}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#389e0d', display: 'inline-block' }} />
                    Active
                  </Flex>
                </Select.Option>
                <Select.Option value="inactive">
                  <Flex align="center" gap={6}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#faad14', display: 'inline-block' }} />
                    Inactive
                  </Flex>
                </Select.Option>
              </Select>
            </Form.Item>

            <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>State</Divider>
            <Form.Item name="state" label="Enabled" valuePropName="checked" extra="Applied when you click Save.">
              <Switch
                checkedChildren="ON"
                unCheckedChildren="OFF"
                style={{ backgroundColor: editStateValue ? '#389e0d' : '#cf1322', minWidth: 54 }}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* ── Create Flag Drawer ── */}
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>Create Flag</span>
          </Flex>
        }
        open={createDrawerOpen}
        onClose={() => { setCreateDrawerOpen(false); createForm.resetFields() }}
        width={520}
        extra={
          <Space>
            <Button onClick={() => { setCreateDrawerOpen(false); createForm.resetFields() }}>Cancel</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={createFlag.isPending}
              onClick={() =>
                createForm.validateFields().then((values) => {
                  createFlag.mutate(
                    {
                      capabilityName: values.capabilityName,
                      controlName: values.controlName,
                      label: values.label,
                      description: values.description,
                      state: values.state ?? false,
                      status: values.status ?? 'active',
                    },
                    {
                      onSuccess: () => {
                        setCreateDrawerOpen(false)
                        createForm.resetFields()
                      },
                    },
                  )
                })
              }
            >
              Create
            </Button>
          </Space>
        }
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ state: false, status: 'active' }}
        >
          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Identity</Divider>
          <Form.Item
            name="capabilityName"
            label="Capability Name"
            rules={[{ required: true, message: 'Required' }, { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' }]}
            extra="Groups related flags together (e.g. payments, auth, onboarding)"
          >
            <Input placeholder="e.g. payments" />
          </Form.Item>
          <Form.Item
            name="controlName"
            label="Control Name"
            rules={[{ required: true, message: 'Required' }, { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' }]}
            extra="Unique identifier within the capability (e.g. enable-checkout-v2)"
          >
            <Input placeholder="e.g. enable-checkout-v2" />
          </Form.Item>

          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Metadata</Divider>
          <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Human-readable name" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={3} placeholder="What does this flag control?" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">
                <Flex align="center" gap={6}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#389e0d', display: 'inline-block' }} />
                  Active
                </Flex>
              </Select.Option>
              <Select.Option value="inactive">
                <Flex align="center" gap={6}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#faad14', display: 'inline-block' }} />
                  Inactive
                </Flex>
              </Select.Option>
            </Select>
          </Form.Item>

          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Initial State</Divider>
          <Form.Item name="state" label="Enabled" valuePropName="checked">
            <Switch
              checkedChildren="ON"
              unCheckedChildren="OFF"
              style={{ backgroundColor: createStateValue ? '#389e0d' : '#cf1322', minWidth: 54 }}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}




