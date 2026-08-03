import { Component } from 'react';
import ErrorFallback from './ErrorFallback';
import { captureException } from '../monitoring/sentry';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null, resetKey: 0 };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        captureException(error, { componentStack: info.componentStack });
    }

    reset = () => {
        this.setState((prev) => ({
            error: null,
            resetKey: prev.resetKey + 1,
        }));
    };

    render() {
        const { error, resetKey } = this.state;
        if (error) {
            return <ErrorFallback error={error} onReset={this.reset} />;
        }
        return <div key={resetKey}>{this.props.children}</div>;
    }
}
