import { Component } from 'react';
import ErrorFallback from './ErrorFallback';
import { captureException } from '../monitoring/sentry';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        captureException(error, { componentStack: info.componentStack });
    }

    reset = () => {
        this.setState({ error: null });
    };

    render() {
        const { error } = this.state;
        if (error) {
            return <ErrorFallback error={error} onReset={this.reset} />;
        }
        return this.props.children;
    }
}
