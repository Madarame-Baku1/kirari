'use client'

import { ErrorPage } from '@/features/error/ErrorPage'

const Error = () => <ErrorPage status={500} onRetry={() => window.location.reload()} />

export default Error
