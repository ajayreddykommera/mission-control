/**
 * HistoryTimeline — vertical changelog for a single selected flag.
 *
 * Props:
 *   data               — filtered history entries for this flag
 *   selectedControl    — controlName of the selected flag
 *   selectedCapability — capabilityName of the selected flag
 */
import { Timeline, Flex, Badge, Typography, Tooltip } from 'antd'
import {
  HistoryOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { stateTag, statusTag, relativeTime, renderChangeDescription } from '@utils/historyUtils'
import type { ControlFlagHistory } from '@types'

const { Text } = Typography

interface HistoryTimelineProps {
  data:               ControlFlagHistory[]
  selectedControl:    string
  selectedCapability: string
}

export default function HistoryTimeline({
  data,
  selectedControl,
  selectedCapability,
}: HistoryTimelineProps) {
  const items = data.map((entry, i) => ({
    key:   i,
    color: entry.state ? '#389e0d' : '#cf1322',
    dot:   entry.state ? (
      <CheckCircleOutlined style={{ fontSize: 15, color: '#389e0d' }} />
    ) : (
      <StopOutlined style={{ fontSize: 15, color: '#cf1322' }} />
    ),
    children: (
      <Flex
        vertical
        gap={6}
        style={{
          background:   '#fafafa',
          border:       '1px solid #f0f0f0',
          borderRadius: 8,
          padding:      '12px 16px',
          marginBottom: 8,
        }}
      >
        <Flex align="center" gap={8} wrap="wrap">
          <Badge
            count={`v${entry.version}`}
            style={{
              backgroundColor: '#e6f4ff',
              color:           '#1677ff',
              fontWeight:      600,
              fontSize:        11,
              boxShadow:       'none',
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
        <div style={{ fontSize: 13.5 }}>
          {renderChangeDescription(entry.changeDescription)}
        </div>
        <Flex align="center" gap={6}>
          <UserOutlined style={{ color: '#8c8c8c', fontSize: 11 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {entry.updatedBy}
          </Text>
        </Flex>
      </Flex>
    ),
  }))

  return (
    <div
      style={{
        background:   '#fff',
        borderRadius: 8,
        border:       '1px solid #f0f0f0',
        padding:      '28px 36px',
      }}
    >
      <Flex align="center" gap={10} style={{ marginBottom: 24 }}>
        <HistoryOutlined style={{ color: '#1677ff', fontSize: 16 }} />
        <Text
          strong
          style={{
            fontSize:   15,
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
            color:      '#1f2d5c',
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
          · {data.length} {data.length === 1 ? 'change' : 'changes'}
        </Text>
      </Flex>

      <Timeline mode="left" items={items} />
    </div>
  )
}
