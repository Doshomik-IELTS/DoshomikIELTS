"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { State } from "@/components/ui/state";

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6">
          <State
            title="Something went wrong"
            description={
              process.env.NODE_ENV === "development" && this.state.error
                ? this.state.error.message
                : "An unexpected error occurred. Please try refreshing the page."
            }
            variant="error"
            action={
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            }
          />
          {process.env.NODE_ENV === "development" && this.state.error && (
            <Card className="mt-4 border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-700">Error Details (Development)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                  {this.state.error.stack}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
