import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initMonitoring } from './monitoring/sentry.js'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

initMonitoring()

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
