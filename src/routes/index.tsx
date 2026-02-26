import { createFileRoute } from '@tanstack/react-router'
import FlagsDashboard from '@components/flags/FlagsDashboard'

export const Route = createFileRoute('/')({ component: FlagsDashboard })
