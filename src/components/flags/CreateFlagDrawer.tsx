/**
 * CreateFlagDrawer — form drawer for creating a new feature flag.
 *
 * Props:
 *   open        — controls drawer visibility
 *   onClose     — called after successful creation or on cancel
 *   createFlag  — mutation from useCreateFlag()
 */
import {
  Drawer,
  Form,
  Input,
  AutoComplete,
  Select,
  Switch,
  Button,
  Space,
  Flex,
  Divider,
} from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import type { ControlFlag } from '@types'
import type { useCreateFlag } from '@hooks/useFlags'

interface CreateFlagDrawerProps {
  open:       boolean
  onClose:    () => void
  createFlag: ReturnType<typeof useCreateFlag>
}

export default function CreateFlagDrawer({ open, onClose, createFlag }: CreateFlagDrawerProps) {
  const [form] = Form.useForm()
  const stateValue        = Form.useWatch('state', form)
  const capabilityValue   = Form.useWatch('capabilityName', form)
  const labelValue        = Form.useWatch('label', form)
  const queryClient       = useQueryClient()
  // Tracks whether the user has manually edited controlName — stops auto-slug.
  const controlNameEdited = useRef(false)

  // Derive existing capability names for AutoComplete suggestions.
  const allFlags     = queryClient.getQueryData<ControlFlag[]>(['flags']) ?? []
  const capabilities = useMemo(
    () => [...new Set(allFlags.map((f) => f.capabilityName))].sort().map((c) => ({ value: c })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFlags.length],
  )

  // Auto-slug: label → controlName (e.g. "Enable Checkout V2" → "enable-checkout-v2")
  // Stops as soon as the user manually edits the controlName field.
  useEffect(() => {
    if (controlNameEdited.current) return
    if (!labelValue) return
    const slug = labelValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    form.setFieldValue('controlName', slug)
    form.validateFields(['controlName']).catch(() => { /* suppress */ })
  }, [labelValue, form])

  // Re-validate controlName whenever capabilityName changes so the
  // duplicate check reflects the new PK immediately.
  useEffect(() => {
    form.validateFields(['controlName']).catch(() => { /* suppress */ })
  }, [capabilityValue, form])

  function isDuplicate(capabilityName: string, controlName: string): boolean {
    const cached = queryClient.getQueryData<ControlFlag[]>(['flags']) ?? []
    return cached.some(
      (f) =>
        f.capabilityName === capabilityName &&
        f.controlName    === controlName    &&
        f.status         !== 'deleted',
    )
  }

  function handleClose() {
    form.resetFields()
    controlNameEdited.current = false
    onClose()
  }

  function handleCreate() {
    form.validateFields().then((values) => {
      createFlag.mutate(
        {
          capabilityName: values.capabilityName,
          controlName:    values.controlName,
          label:          values.label,
          description:    values.description,
          state:          values.state ?? false,
          status:         values.status ?? 'active',
        },
        { onSuccess: handleClose },
      )
    })
  }

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <PlusOutlined style={{ color: '#1677ff' }} />
          <span>Create Flag</span>
        </Flex>
      }
      open={open}
      onClose={handleClose}
      width={520}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={createFlag.isPending}
            onClick={handleCreate}
          >
            Create
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ state: false, status: 'active' }}
      >
        <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Identity</Divider>

        <Form.Item
          name="capabilityName"
          label="Capability Name"
          rules={[
            { required: true, message: 'Required' },
            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' },
          ]}
          extra="Groups related flags together (e.g. payments, auth, onboarding)"
        >
          <AutoComplete
            options={capabilities}
            placeholder="e.g. payments"
            filterOption={(input, opt) => (opt?.value ?? '').includes(input)}
          />
        </Form.Item>

        <Form.Item
          name="controlName"
          label="Control Name"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Required' },
            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' },
            {
              validator(_, value) {
                if (!value) return Promise.resolve()
                const capability = form.getFieldValue('capabilityName') as string | undefined
                if (capability && isDuplicate(capability, value)) {
                  return Promise.reject(
                    new Error(`"${capability} / ${value}" already exists`),
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
          extra="Unique identifier within the capability (e.g. enable-checkout-v2)"
        >
          <Input
            placeholder="e.g. enable-checkout-v2"
            onChange={() => { controlNameEdited.current = true }}
          />
        </Form.Item>

        <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Metadata</Divider>

        <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="Human-readable name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Required' }]}
        >
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
            style={{ backgroundColor: stateValue ? '#389e0d' : '#cf1322', minWidth: 54 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
