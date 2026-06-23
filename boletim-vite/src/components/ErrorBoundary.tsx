import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "2rem",
              textAlign: "center",
              fontFamily: "sans-serif",
            }}
          >
            <h2 style={{ color: "#E53E3E", marginBottom: "0.5rem" }}>
              Algo deu errado
            </h2>
            <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
              Ocorreu um erro inesperado. Recarregue a página ou tente novamente mais tarde.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#3182CE",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Recarregar
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "#FFF5F5",
                  border: "1px solid #FC8181",
                  borderRadius: "6px",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  maxWidth: "600px",
                  overflow: "auto",
                  color: "#C53030",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
