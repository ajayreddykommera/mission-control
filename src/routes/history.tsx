import { createFileRoute } from '@tanstack/react-router'
import FlagsHistoryDashboard from '@components/flags-history/FlagsHistoryDashboard'

export const Route = createFileRoute('/history')({ component: FlagsHistoryDashboard })
