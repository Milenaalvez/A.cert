import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#030205] text-white px-6">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
          <p className="text-[#A78BFA] mb-6 text-center">Tente recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            className="hero-btn-primary px-6 py-3 rounded-[10px]"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
