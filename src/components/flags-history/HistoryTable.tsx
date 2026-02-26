/**
 * HistoryTable — paginated table showing history across all flags.
 *
 * Props:
 *   data         — filtered history entries to display
 *   currentPage  — controlled page number
 *   pageSize     — controlled page size
 *   onPageChange — (page, size) => void
 *   onFlagClick  — called with "cap::ctrl" key when the flag cell is clicked
 */
import { Table, Flex, Typography, Badge, Tooltip } from 'antd'
import { UserOutlined, ClockCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { stateTag, statusTag, relativeTime, renderChangeDescription } from '@utils/historyUtils'
import type { ControlFlagHistory } from '@types'

const { Text } = Typography

interface HistoryTableProps {
  data:         ControlFlagHistory[]
  currentPage:  number
  pageSize:     number
  onPageChange: (page: number, size: number) => void
  onFlagClick:  (key: string) => void
}

function makeColumns(onFlagClick: (key: string) => void) {
  return [
    {
      key:   'flag',
      title: 'Flag',
      width: 240,
      render: (_: unknown, r: ControlFlagHistory) => (
        <Tooltip title="View timeline for this flag">
          <Flex
            vertical
            gap={2}
            onClick={() => onFlagClick(`${r.capabilityName}::${r.controlName}`)}
            style={{ cursor: 'pointer' }}
            className="history-flag-cell"
          >
            <Flex align="center" gap={6}>
              <Text
                strong
                style={{
                  fontFamily: "'SF Mono','Fira Code','Cascadia Code','Consolas',monospace",
                  fontSize: 13,
                  color: '#1677ff',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: 3,
                }}
              >
                {r.controlName}
              </Text>
              <LinkOutlined style={{ fontSize: 11, color: '#1677ff', opacity: 0.7 }} />
            </Flex>
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
        </Tooltip>
      ),
    },
    {
      key:   'version',
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
      key:       'change',
      title:     'Change Description',
      dataIndex: 'changeDescription',
      render:    (v: string) => renderChangeDescription(v),
    },
    {
      key:    'state',
      title:  'State',
      width:  80,
      render: (_: unknown, r: ControlFlagHistory) => stateTag(r.state),
    },
    {
      key:    'status',
      title:  'Status',
      width:  100,
      render: (_: unknown, r: ControlFlagHistory) => statusTag(r.status),
    },
    {
      key:       'by',
      title:     'Updated By',
      dataIndex: 'updatedBy',
      width:     190,
      render:    (v: string) => (
        <Flex align="center" gap={6}>
          <UserOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 12 }}>{v}</Text>
        </Flex>
      ),
    },
    {
      key:       'when',
      title:     'When',
      dataIndex: 'updatedAt',
      width:     130,
      render:    (v: string) => (
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
}

export default function HistoryTable({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onFlagClick,
}: HistoryTableProps) {
  return (
    <Table<ControlFlagHistory>
      rowKey={(r) => `${r.controlName}_v${r.version}_${r.updatedAt}`}
      dataSource={data}
      columns={makeColumns(onFlagClick)}
      pagination={{
        current:         currentPage,
        pageSize,
        showSizeChanger: true,
        pageSizeOptions: ['10', '25', '50', '100'],
        showTotal:       (t) => `${t} entries`,
        onChange:        onPageChange,
      }}
      size="middle"
      bordered
    />
  )
}
