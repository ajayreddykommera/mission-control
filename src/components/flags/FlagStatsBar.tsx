/**
 * FlagStatsBar — summary stat cards above the flags table.
 *
 * Receives the full flags array and derives all counts internally
 * so the parent stays free of display logic.
 */
import { Card, Flex, Typography } from 'antd'
import {
  FlagOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  PoweroffOutlined,
} from '@ant-design/icons'
import type { ControlFlag } from '@types'

const { Text } = Typography

interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  accent: string
  valueColor: string
}

interface FlagStatsBarProps {
  flags: ControlFlag[]
}

export default function FlagStatsBar({ flags }: FlagStatsBarProps) {
  const activeCount   = flags.filter((f) => f.status === 'active').length
  const inactiveCount = flags.filter((f) => f.status === 'inactive').length
  const deletedCount  = flags.filter((f) => f.status === 'deleted').length
  const enabledCount  = flags.filter((f) => f.state && f.status !== 'deleted').length

  const stats: StatItem[] = [
    {
      label:      'Total Flags',
      value:      flags.length,
      icon:       <FlagOutlined style={{ fontSize: 18, color: '#1677ff' }} />,
      iconBg:     '#e6f4ff',
      accent:     '#1677ff',
      valueColor: '#1f2d5c',
    },
    {
      label:      'Active',
      value:      activeCount,
      icon:       <CheckCircleOutlined style={{ fontSize: 18, color: '#389e0d' }} />,
      iconBg:     '#f6ffed',
      accent:     '#52c41a',
      valueColor: '#389e0d',
    },
    {
      label:      'Inactive',
      value:      inactiveCount,
      icon:       <ExclamationCircleOutlined style={{ fontSize: 18, color: '#d48806' }} />,
      iconBg:     '#fffbe6',
      accent:     '#faad14',
      valueColor: '#d48806',
    },
    {
      label:      'Deleted',
      value:      deletedCount,
      icon:       <StopOutlined style={{ fontSize: 18, color: '#cf1322' }} />,
      iconBg:     '#fff1f0',
      accent:     '#ff4d4f',
      valueColor: '#cf1322',
    },
    {
      label:      'Enabled (ON)',
      value:      enabledCount,
      icon:       <PoweroffOutlined style={{ fontSize: 18, color: '#08979c' }} />,
      iconBg:     '#e6fffb',
      accent:     '#13c2c2',
      valueColor: '#08979c',
    },
  ]

  return (
    <Flex gap={16} style={{ marginBottom: 28 }}>
      {stats.map(({ label, value, icon, iconBg, accent, valueColor }) => (
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
              <Text
                style={{
                  fontSize: 12,
                  color: '#6e7f9d',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
              <Flex align="baseline" gap={6} style={{ marginTop: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: valueColor }}>
                  {value}
                </span>
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
  )
}
