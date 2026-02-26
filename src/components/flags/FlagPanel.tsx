/**
 * FlagPanel — search bar + status tabs + flags table in one panel.
 *
 * Owns all display state: search text, sorting, pagination, status filter.
 * Mutations (toggle, delete) are received as props from the parent so that
 * cache management stays in one place (the hooks).
 *
 * Props:
 *   flags       — full flag list (already fetched)
 *   isLoading   — show table skeleton while loading
 *   toggleFlag  — mutation object from useToggleFlag()
 *   deleteFlag  — mutation object from useDeleteFlag()
 *   onView      — open view drawer for a flag
 *   onEdit      — open edit drawer for a flag
 */
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
  Empty,
  Typography,
  Space,
  Tooltip,
  Flex,
  Tabs,
  Badge,
  Popconfirm,
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
} from '@ant-design/icons'
import type { ControlFlag } from '@types'
import type { useToggleFlag, useDeleteFlag } from '@hooks/useFlags'

const { Text } = Typography

// ── Column helper ─────────────────────────────────────────────────────────
const col = createColumnHelper<ControlFlag>()

const baseColumns = [
  col.accessor('label', {
    header: 'Label',
    cell: (info) => <Text strong>{info.getValue()}</Text>,
  }),
  col.accessor('description', {
    header: 'Description',
    enableSorting: false,
    cell: (info) => (
      <Text type="secondary" style={{ maxWidth: 280, display: 'inline-block' }}>
        {info.getValue()}
      </Text>
    ),
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const val = info.getValue()
      const config: Record<string, { color: string; dot: string; label: string }> = {
        active:   { color: 'green',   dot: '#389e0d', label: 'Active'   },
        inactive: { color: 'default', dot: '#faad14', label: 'Inactive' },
        deleted:  { color: 'red',     dot: '#cf1322', label: 'Deleted'  },
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
      <Text type="secondary" style={{ fontSize: 12 }}>
        {new Date(info.getValue()).toLocaleString()}
      </Text>
    ),
  }),
]

// ── Types ─────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted'

interface FlagPanelProps {
  flags:       ControlFlag[]
  isLoading:   boolean
  toggleFlag:  ReturnType<typeof useToggleFlag>
  deleteFlag:  ReturnType<typeof useDeleteFlag>
  onView:      (flag: ControlFlag) => void
  onEdit:      (flag: ControlFlag) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export default function FlagPanel({
  flags,
  isLoading,
  toggleFlag,
  deleteFlag,
  onView,
  onEdit,
}: FlagPanelProps) {
  const [searchText,    setSearchText]    = useState('')
  const [globalFilter,  setGlobalFilter]  = useState('')
  const [sorting,       setSorting]       = useState<SortingState>([{ id: 'lastUpdatedAt', desc: true }])
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all')
  const [tablePage,     setTablePage]     = useState(1)
  const [tablePageSize, setTablePageSize] = useState(10)

  // Debounce: update table filter 200 ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setGlobalFilter(searchText), 200)
    return () => clearTimeout(t)
  }, [searchText])

  const activeCount   = flags.filter((f) => f.status === 'active').length
  const inactiveCount = flags.filter((f) => f.status === 'inactive').length
  const deletedCount  = flags.filter((f) => f.status === 'deleted').length

  const tabData = statusFilter === 'all' ? flags : flags.filter((f) => f.status === statusFilter)

  const table = useReactTable({
    data: tabData,
    columns: baseColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:     getCoreRowModel(),
    getSortedRowModel:   getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Build antd column config from TanStack column headers
  const antColumns = useMemo(
    () =>
      table.getFlatHeaders().map((header) => ({
        key:       header.id,
        title:     flexRender(header.column.columnDef.header, header.getContext()),
        dataIndex: header.id,
        sorter:    header.column.getCanSort() ? true : undefined,
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
          const row  = table.getRowModel().rows.find((r) => r.original === record)
          if (!row) return null
          const cell = row.getVisibleCells().find((c) => c.column.id === header.id)
          if (!cell) return null
          return flexRender(cell.column.columnDef.cell, cell.getContext())
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, sorting],
  )

  // Flag column — Switch + control name + capability name
  const flagColumn = {
    key:   'flag',
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
              controlName:    record.controlName,
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
              fontFamily: "'SF Mono','Fira Code','Cascadia Code','Consolas',monospace",
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
    key:   'action',
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
            onClick={() => onView(record)}
          />
        </Tooltip>
        <Tooltip title={record.status === 'deleted' ? 'Cannot edit a deleted flag' : 'Edit'}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: record.status === 'deleted' ? undefined : '#d48806' }} />}
            disabled={record.status === 'deleted'}
            onClick={() => onEdit(record)}
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
                  This will mark the flag as <Tag color="error" style={{ margin: 0 }}>Deleted</Tag> and it will no longer be active and cannot be restored.
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
                controlName:    record.controlName,
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

  const matchCount = table.getFilteredRowModel().rows.length

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* ── Search bar ── */}
      <div style={{ padding: '20px 24px 0' }}>
        <Input
          placeholder="Search by flag name, capability, label…"
          prefix={
            <SearchOutlined
              style={{ color: searchText ? '#1677ff' : '#adb5c7', fontSize: 15, transition: 'color .2s' }}
            />
          }
          suffix={
            searchText ? (
              <Flex align="center" gap={8}>
                <Badge
                  count={matchCount}
                  color={matchCount === 0 ? '#ff4d4f' : '#1677ff'}
                  style={{ fontSize: 11 }}
                  overflowCount={999}
                  title={`${matchCount} match${matchCount === 1 ? '' : 'es'}`}
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
            boxShadow: searchText ? '0 0 0 2px rgba(22,119,255,0.08)' : undefined,
            transition: 'box-shadow .2s',
          }}
        />
        {searchText && matchCount === 0 && (
          <Flex align="center" gap={6} style={{ marginTop: 8, paddingLeft: 2 }}>
            <span style={{ fontSize: 13, color: '#ff4d4f' }}>
              No flags match <strong>"{searchText}"</strong> — try a different keyword.
            </span>
          </Flex>
        )}
        {searchText && matchCount > 0 && (
          <Flex align="center" gap={6} style={{ marginTop: 8, paddingLeft: 2 }}>
            <span style={{ fontSize: 13, color: '#6e7f9d' }}>
              Showing <strong style={{ color: '#1677ff' }}>{matchCount}</strong> of{' '}
              <strong>{flags.length}</strong> flag{flags.length === 1 ? '' : 's'} matching{' '}
              <strong>"{searchText}"</strong>
            </span>
          </Flex>
        )}

      </div>

      {/* ── Status tabs ── */}
      <div style={{ padding: '0 24px' }}>
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => {
            setStatusFilter(key as StatusFilter)
            setTablePage(1)
          }}
          style={{ marginBottom: 0 }}
          items={[
            { key: 'all',      label: `All (${flags.length})`,        icon: <AppstoreOutlined />    },
            { key: 'active',   label: `Active (${activeCount})`,      icon: <CheckCircleOutlined /> },
            { key: 'inactive', label: `Inactive (${inactiveCount})`,  icon: <MinusCircleOutlined /> },
            { key: 'deleted',  label: `Deleted (${deletedCount})`,    icon: <StopOutlined />        },
          ]}
        />
      </div>

      {/* ── Table — flush so borders extend edge-to-edge ── */}
      <Table<ControlFlag>
        rowKey={(r) => `${r.capabilityName}__${r.controlName}`}
        dataSource={table.getRowModel().rows.map((r) => r.original)}
        columns={[flagColumn, ...antColumns, actionColumn]}
        loading={isLoading}
        rowClassName={(r) => (r.status === 'deleted' ? 'row-deleted' : '')}
        onRow={(record) => ({
          onClick: () => onView(record),
          style: { cursor: 'pointer' },
        })}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '32px 0' }}
              description={
                searchText
                  ? `No flags match "${searchText}"`
                  : statusFilter === 'deleted'
                  ? 'No deleted flags — keeping things tidy!'
                  : statusFilter === 'inactive'
                  ? 'No inactive flags here'
                  : statusFilter === 'active'
                  ? 'No active flags yet — create one!'
                  : 'No flags yet — create your first one!'
              }
            />
          ),
        }}
        pagination={{
          current:         tablePage,
          pageSize:        tablePageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50'],
          showTotal:       (t) => `${t} flags`,
          onChange: (page, size) => {
            setTablePage(page)
            setTablePageSize(size)
          },
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      <style>{`
        .row-deleted td { background-color: #fafafa !important; }
        .ant-table-column-sort { background: transparent !important; }
      `}</style>
    </div>
  )
}
