import { AlertTriangle } from 'lucide-react'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6">
          <div className="bg-card border border-line rounded-2xl shadow-card p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4"></div>
            <h2 className="text-xl font-bold text-ink mb-2">Algo correu mal</h2>
            <p className="text-sm text-ink2 mb-6">
              Ocorreu um erro inesperado. Tenta recarregar a página ou contacta o suporte se o problema persistir.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-ink2 cursor-pointer hover:text-ink">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="primary">
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.reload()} variant="ghost">
                Recarregar página
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
