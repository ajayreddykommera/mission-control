/**
 * historyUtils — shared display helpers for the Flags History feature.
 *
 * stateTag(state)              — ON / OFF tag
 * statusTag(status)            — active / inactive / deleted tag
 * relativeTime(iso)            — human-readable "2h ago" string
 * renderChangeDescription(raw) — styled before → after diff chips
 */
import React from 'react'
import { Tag, Flex, Typography } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'

const { Text } = Typography

export function stateTag(state: boolean) {
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

export function statusTag(status: string) {
  const colors: Record<string, string> = {
    active:   'green',
    inactive: 'default',
    deleted:  'red',
  }
  return (
    <Tag color={colors[status] ?? 'default'} style={{ textTransform: 'capitalize' }}>
      {status}
    </Tag>
  )
}

/**
 * Parses a changeDescription string like:
 *   "State: OFF → ON · Label: \"Old\" → \"New\" · Status: active → deleted"
 * and renders each clause with a styled red (before) → green (after) chip pair.
 * Falls back to plain text for any clause that doesn't match the Field: x → y pattern.
 */
export function renderChangeDescription(raw: string): React.ReactNode {
  if (!raw || raw === 'No changes') {
    return (
      <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
        {raw || '—'}
      </Text>
    )
  }

  const clauses = raw.split(' · ')

  return (
    <Flex wrap="wrap" gap={6}>
      {clauses.map((clause, i) => {
        // Match "Field: before → after" — greedy on 'before' so last " → " is the separator
        const m = clause.match(/^([^:]+):\s(.+)\s→\s(.+)$/)
        if (m) {
          const [, field, before, after] = m
          return (
            <Flex key={i} align="center" gap={4} style={{ flexWrap: 'nowrap' }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 500 }}>
                {field}:
              </Text>
              <Text
                style={{
                  fontSize:     12,
                  background:   '#fff1f0',
                  color:        '#cf1322',
                  borderRadius: 3,
                  padding:      '1px 5px',
                  border:       '1px solid #ffccc7',
                }}
              >
                {before}
              </Text>
              <ArrowRightOutlined style={{ fontSize: 10, color: '#8c8c8c', flexShrink: 0 }} />
              <Text
                style={{
                  fontSize:     12,
                  background:   '#f6ffed',
                  color:        '#389e0d',
                  borderRadius: 3,
                  padding:      '1px 5px',
                  border:       '1px solid #b7eb8f',
                }}
              >
                {after}
              </Text>
            </Flex>
          )
        }
        // No arrow pattern — plain text (e.g. "No changes")
        return (
          <Text key={i} type="secondary" style={{ fontSize: 12 }}>
            {clause}
          </Text>
        )
      })}
    </Flex>
  )
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
