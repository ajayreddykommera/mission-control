/**
 * HistoryControls — flag picker + search bar for the History page.
 *
 * Props:
 *   flags           — full flag list (for the select options)
 *   selectedFlag    — current "capabilityName::controlName" value or null
 *   onFlagChange    — called when the user picks / clears a flag
 *   search          — current search string
 *   onSearchChange  — called when the search input changes
 *   totalEntries    — shown as a result count when data is ready
 *   isLoading       — hides the count while fetching
 */
import { Select, Input, Flex, Typography } from 'antd'
import { SearchOutlined, BranchesOutlined } from '@ant-design/icons'
import type { ControlFlag } from '@types'

const { Text } = Typography

interface HistoryControlsProps {
  flags:          ControlFlag[]
  selectedFlag:   string | null
  onFlagChange:   (value: string | null) => void
  search:         string
  onSearchChange: (value: string) => void
  totalEntries:   number
  isLoading:      boolean
}

export default function HistoryControls({
  flags,
  selectedFlag,
  onFlagChange,
  search,
  onSearchChange,
  totalEntries,
  isLoading,
}: HistoryControlsProps) {
  const flagOptions = flags.map((f) => ({
    value:          `${f.capabilityName}::${f.controlName}`,
    label:          f.controlName,
    capabilityName: f.capabilityName,
    controlName:    f.controlName,
  }))

  return (
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
        onChange={(v) => onFlagChange(v ?? null)}
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
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {!isLoading && totalEntries > 0 && (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
        </Text>
      )}
    </Flex>
  )
}
