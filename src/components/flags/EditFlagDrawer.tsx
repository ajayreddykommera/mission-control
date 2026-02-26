/**
 * EditFlagDrawer — form drawer for editing an existing flag.
 *
 * All changes (label, description, status, state) are sent in a single PATCH
 * call. The server reads the "before" state, computes a rich diff description
 * (e.g. "State: OFF → ON · Status: active → inactive"), and writes one audit
 * history entry — no matter which combination of fields changed.
 *
 * Props:
 *   flag        — flag being edited; null means the drawer is closed
 *   onClose     — called after a successful save/delete or on cancel
 *   updateFlag  — mutation from useUpdateFlag()
 *   deleteFlag  — mutation from useDeleteFlag()
 */
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Flex,
  Divider,
  Tag,
  Popconfirm,
} from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { ControlFlag } from '@types'
import type { useUpdateFlag, useDeleteFlag } from '@hooks/useFlags'

interface EditFlagDrawerProps {
  flag:       ControlFlag | null
  onClose:    () => void
  updateFlag: ReturnType<typeof useUpdateFlag>
  deleteFlag: ReturnType<typeof useDeleteFlag>
}

export default function EditFlagDrawer({
  flag,
  onClose,
  updateFlag,
  deleteFlag,
}: EditFlagDrawerProps) {
  const [form] = Form.useForm()
  const stateValue = Form.useWatch('state', form)

  function handleClose() {
    form.resetFields()
    onClose()
  }

  function handleSave() {
    if (!flag) return
    form.validateFields().then((values) => {
      // Single PATCH call — server auto-generates the audit description from
      // a before→after diff and writes one history entry.
      updateFlag.mutate(
        {
          capabilityName: flag.capabilityName,
          controlName:    flag.controlName,
          label:          values.label,
          description:    values.description,
          status:         values.status,
          state:          values.state,
        },
        { onSuccess: handleClose },
      )
    })
  }

  function handleDelete() {
    if (!flag) return
    deleteFlag.mutate(
      { capabilityName: flag.capabilityName, controlName: flag.controlName },
      { onSuccess: handleClose },
    )
  }

  return (
    <Drawer
      title={`Edit — ${flag?.controlName}`}
      open={!!flag}
      onClose={handleClose}
      width={580}
      destroyOnClose
      extra={
        <Space>
          <Popconfirm
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
                    {flag?.controlName}
                  </strong>{' '}
                  under capability{' '}
                  <strong style={{ color: '#6e7f9d', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>
                    {flag?.capabilityName}
                  </strong>.
                </span>
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  This will mark the flag as <Tag color="error" style={{ margin: 0 }}>Deleted</Tag> and it will no longer be active.
                </span>
              </Flex>
            }
            okText="Yes, delete it"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            overlayStyle={{ maxWidth: 380 }}
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteFlag.isPending}>
              Delete
            </Button>
          </Popconfirm>

          <Button onClick={handleClose}>Cancel</Button>

          <Button
            type="primary"
            loading={updateFlag.isPending}
            onClick={handleSave}
          >
            Save
          </Button>
        </Space>
      }
    >
      {flag && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            label:       flag.label,
            description: flag.description,
            status:      flag.status,
            state:       flag.state,
          }}
        >
          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Identity</Divider>

          <Form.Item label="Capability">
            <Input value={flag.capabilityName} disabled />
          </Form.Item>
          <Form.Item label="Control Name">
            <Input value={flag.controlName} disabled />
          </Form.Item>

          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>Metadata</Divider>

          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
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

          <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>State</Divider>

          <Form.Item
            name="state"
            label="Enabled"
            valuePropName="checked"
            extra="Applied when you click Save."
          >
            <Switch
              checkedChildren="ON"
              unCheckedChildren="OFF"
              style={{ backgroundColor: stateValue ? '#389e0d' : '#cf1322', minWidth: 54 }}
            />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  )
}
