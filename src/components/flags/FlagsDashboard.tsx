/**
 * FlagsDashboard — top-level orchestrator for the Feature Flags page.
 *
 * Owns all hooks and drawer open/close state, then composes:
 *   FlagStatsBar      — summary stat cards
 *   FlagPanel         — search + tabs + table
 *   ViewFlagDrawer    — read-only details drawer
 *   EditFlagDrawer    — edit form drawer
 *   CreateFlagDrawer  — create form drawer
 */
import { useEffect, useState } from 'react'
import { Alert, Button, Flex, Spin, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useFlags, useToggleFlag, useUpdateFlag, useDeleteFlag, useCreateFlag } from '@hooks/useFlags'
import type { ControlFlag } from '@types'
import FlagStatsBar     from './FlagStatsBar'
import FlagPanel        from './FlagPanel'
import ViewFlagDrawer   from './ViewFlagDrawer'
import EditFlagDrawer   from './EditFlagDrawer'
import CreateFlagDrawer from './CreateFlagDrawer'

const { Title, Text } = Typography

export default function FlagsDashboard() {
  // isMounted flips true after the first client render, by which point
  // antd has injected all styles — prevents flash of unstyled content.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const { flags, isLoading, error } = useFlags()
  const toggleFlag = useToggleFlag()
  const updateFlag = useUpdateFlag()
  const deleteFlag = useDeleteFlag()
  const createFlag = useCreateFlag()

  const [viewFlag,         setViewFlag]         = useState<ControlFlag | null>(null)
  const [editFlag,         setEditFlag]         = useState<ControlFlag | null>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

  if (!isMounted || isLoading) {
    return (
      <Flex vertical align="center" justify="center" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f0f2f5' }}>

      {/* ── Page header ── */}
      <Flex align="flex-start" justify="space-between" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Feature Flags</Title>
          <Text type="secondary">Mission Control · toggle features without deploying</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateDrawerOpen(true)}
        >
          Create Flag
        </Button>
      </Flex>

      {/* ── Stats bar ── */}
      {!error && <FlagStatsBar flags={flags} />}

      {/* ── Error ── */}
      {error && (
        <Alert
          type="error"
          message="Failed to load flags"
          description={error}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* ── Search + tabs + table ── */}
      {!error && (
        <FlagPanel
          flags={flags}
          isLoading={isLoading}
          toggleFlag={toggleFlag}
          deleteFlag={deleteFlag}
          onView={setViewFlag}
          onEdit={setEditFlag}
        />
      )}

      {/* ── Drawers ── */}
      <ViewFlagDrawer
        flag={viewFlag}
        onClose={() => setViewFlag(null)}
      />

      <EditFlagDrawer
        flag={editFlag}
        onClose={() => setEditFlag(null)}
        onSaveSuccess={(updated) => {
          setEditFlag(null)
          setViewFlag(updated)
        }}
        updateFlag={updateFlag}
        deleteFlag={deleteFlag}
      />

      <CreateFlagDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        createFlag={createFlag}
      />

    </div>
  )
}
