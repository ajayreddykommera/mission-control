/**
 * FlagsHistoryDashboard — top-level orchestrator for the History page.
 *
 * Owns all data fetching and UI state, then composes:
 *   HistoryControls  — flag picker + search bar
 *   HistoryTable     — all-flags paginated table
 *   HistoryTimeline  — per-flag vertical changelog
 */
import { useState, useMemo } from 'react'
import { Alert, Breadcrumb, Empty, Flex, Spin, Typography } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { useFlags } from '@hooks/useFlags'
import { useAllHistory, useFlagHistory } from '@hooks/useHistory'
import type { ControlFlagHistory } from '@types'
import HistoryControls from './HistoryControls'
import HistoryTable    from './HistoryTable'
import HistoryTimeline from './HistoryTimeline'

const { Title, Text } = Typography

export default function FlagsHistoryDashboard() {
  const { flags } = useFlags()

  // "capabilityName::controlName" or null for all-flags view
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [pageSize,     setPageSize]     = useState(25)
  const [currentPage,  setCurrentPage]  = useState(1)

  const selectedParts      = selectedFlag ? selectedFlag.split('::') : null
  const selectedCapability = selectedParts?.[0] ?? ''
  const selectedControl    = selectedParts?.[1] ?? ''

  const allHistoryQuery  = useAllHistory()
  const flagHistoryQuery = useFlagHistory(selectedCapability, selectedControl, !!selectedFlag)

  const activeData: ControlFlagHistory[] = selectedFlag
    ? (flagHistoryQuery.data ?? [])
    : (allHistoryQuery.data  ?? [])

  const isLoading = selectedFlag ? flagHistoryQuery.isLoading : allHistoryQuery.isLoading
  const error     = selectedFlag ? flagHistoryQuery.error     : allHistoryQuery.error

  const filteredData = useMemo(() => {
    if (!search) return activeData
    const q = search.toLowerCase()
    return activeData.filter(
      (h) =>
        h.controlName.toLowerCase().includes(q)       ||
        h.capabilityName.toLowerCase().includes(q)    ||
        h.changeDescription.toLowerCase().includes(q) ||
        h.updatedBy.toLowerCase().includes(q),
    )
  }, [activeData, search])

  function handleFlagChange(value: string | null) {
    setSelectedFlag(value)
    setSearch('')
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <div style={{ padding: '32px 40px' }}>

      {/* ── Breadcrumbs — only shown in timeline (flag selected) view ── */}
      {selectedFlag && (
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            {
              title: (
                <a onClick={() => handleFlagChange(null)} style={{ cursor: 'pointer' }}>
                  <Flex align="center" gap={5}>
                    <HistoryOutlined />
                    <span>History</span>
                  </Flex>
                </a>
              ),
            },
            {
              title: (
                <Flex align="center" gap={6}>
                  <Text
                    style={{
                      fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
                      fontSize: 13,
                      color: '#1f2d5c',
                      fontWeight: 600,
                    }}
                  >
                    {selectedControl}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {selectedCapability}
                  </Text>
                </Flex>
              ),
            },
          ]}
        />
      )}

      {/* ── Page header ── */}
      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Flags History</Title>
          <Text type="secondary">Audit log of all flag state and metadata changes</Text>
        </div>
      </Flex>

      {/* ── Controls ── */}
      <HistoryControls
        flags={flags}
        selectedFlag={selectedFlag}
        onFlagChange={handleFlagChange}
        search={search}
        onSearchChange={handleSearchChange}
        totalEntries={filteredData.length}
        isLoading={isLoading}
      />

      {/* ── Error ── */}
      {error && (
        <Alert
          type="error"
          message="Failed to load history"
          description={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Body ── */}
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
        <HistoryTimeline
          data={filteredData}
          selectedControl={selectedControl}
          selectedCapability={selectedCapability}
        />
      ) : (
        <HistoryTable
          data={filteredData}
          currentPage={currentPage}
          pageSize={pageSize}
          onFlagClick={handleFlagChange}
          onPageChange={(page, size) => {
            setCurrentPage(page)
            setPageSize(size)
          }}
        />
      )}

    </div>
  )
}
