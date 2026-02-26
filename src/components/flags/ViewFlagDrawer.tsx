/**
 * ViewFlagDrawer — read-only details panel for a single flag.
 *
 * Props:
 *   flag    — flag to display; null means the drawer is closed
 *   onClose — called when the user dismisses the drawer
 */
import { Drawer, Flex, Tag, Typography, Divider, Tooltip } from 'antd'
import type { ControlFlag } from '@types'

const { Text } = Typography

interface ViewFlagDrawerProps {
  flag:    ControlFlag | null
  onClose: () => void
}

const STATUS_COLOR: Record<string, string> = {
  active:   'green',
  inactive: 'default',
  deleted:  'red',
}

export default function ViewFlagDrawer({ flag, onClose }: ViewFlagDrawerProps) {
  return (
    <Drawer
      title={
        flag && (
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
                {flag.controlName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#6e7f9d',
                  fontWeight: 500,
                }}
              >
                {flag.capabilityName}
              </Text>
            </Flex>
          </Flex>
        )
      }
      open={!!flag}
      onClose={onClose}
      width={520}
    >
      {flag && (
        <Flex vertical gap={20}>

          {/* ── Hero state card ── */}
          <Flex
            align="center"
            justify="space-between"
            style={{
              background: flag.state ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${flag.state ? '#b7eb8f' : '#ffccc7'}`,
              borderRadius: 10,
              padding: '16px 20px',
            }}
          >
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current State
              </Text>
              <Text strong style={{ fontSize: 22, color: flag.state ? '#389e0d' : '#cf1322' }}>
                {flag.state ? 'ON' : 'OFF'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{flag.label}</Text>
            </Flex>
            <Flex vertical gap={6} align="flex-end">
              <Tag
                color={STATUS_COLOR[flag.status] ?? 'default'}
                style={{ textTransform: 'capitalize', margin: 0 }}
              >
                {flag.status}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>v{flag.version}</Text>
            </Flex>
          </Flex>

          {/* ── Description ── */}
          {flag.description && (
            <Flex vertical gap={4}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Description
              </Text>
              <Text style={{ fontSize: 13.5, color: '#1a1a2e', lineHeight: 1.6 }}>
                {flag.description}
              </Text>
            </Flex>
          )}

          <Divider style={{ margin: '4px 0' }} />

          {/* ── Identity ── */}
          <Flex vertical gap={12}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Identity
            </Text>
            <Flex vertical gap={8}>
              {[
                { sublabel: 'Control Name', value: flag.controlName,    color: '#1f2d5c' },
                { sublabel: 'Capability',   value: flag.capabilityName, color: '#6e7f9d' },
              ].map(({ sublabel, value, color }) => (
                <Flex
                  key={sublabel}
                  align="center"
                  justify="space-between"
                  style={{ background: '#f5f7fa', borderRadius: 6, padding: '8px 12px' }}
                >
                  <Flex vertical gap={1}>
                    <Text type="secondary" style={{ fontSize: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      {sublabel}
                    </Text>
                    <Typography.Text
                      copyable={{ tooltips: ['Copy', 'Copied!'] }}
                      style={{
                        fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color,
                      }}
                    >
                      {value}
                    </Typography.Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Flex>

          <Divider style={{ margin: '4px 0' }} />

          {/* ── Integration ── */}
          <Flex vertical gap={12}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Integration
            </Text>
            <Flex vertical gap={10}>
              <Flex vertical gap={4}>
                <Text style={{ fontSize: 12, color: '#595959' }}>Check flag state (GET)</Text>
                <Flex
                  align="center"
                  justify="space-between"
                  style={{ background: '#1a1a2e', borderRadius: 6, padding: '8px 14px' }}
                >
                  <Typography.Text
                    copyable={{
                      tooltips: ['Copy', 'Copied!'],
                      text: `/api/flags/${flag.capabilityName}/${flag.controlName}`,
                    }}
                    style={{
                      fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
                      fontSize: 11.5,
                      color: '#a8d8a8',
                    }}
                  >
                    {`GET /api/flags/${flag.capabilityName}/${flag.controlName}`}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          <Divider style={{ margin: '4px 0' }} />

          {/* ── Audit ── */}
          <Flex vertical gap={8}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Audit
            </Text>
            <Flex justify="space-between">
              <Text type="secondary" style={{ fontSize: 12 }}>Last updated by</Text>
              <Text style={{ fontSize: 12 }}>{flag.updatedBy}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text type="secondary" style={{ fontSize: 12 }}>Last updated at</Text>
              <Tooltip title={new Date(flag.lastUpdatedAt).toISOString()}>
                <Text style={{ fontSize: 12 }}>{new Date(flag.lastUpdatedAt).toLocaleString()}</Text>
              </Tooltip>
            </Flex>
          </Flex>

        </Flex>
      )}
    </Drawer>
  )
}
