'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className='flex flex-col items-center justify-center gap-4 p-8 text-center'>
          <p className='text-destructive font-medium'>Đã xảy ra lỗi khi hiển thị nội dung.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className='text-xs text-muted-foreground max-w-md overflow-auto'>
              {this.state.error.message}
            </pre>
          )}
          <Button variant='outline' onClick={this.handleReset}>
            Thử lại
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

