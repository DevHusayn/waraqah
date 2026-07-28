import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import { initMonitoring } from './monitoring/sentry.js'
import {
    initPwaSessionLifecycle,
    markPwaSessionAlive,
    shouldShowPwaSplash,
} from './utils/splashSession.js'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

initMonitoring()
initPwaSessionLifecycle()

registerSW({ immediate: true })

const showSplash = shouldShowPwaSplash()

if (!showSplash) {
    markPwaSessionAlive()
}

function Root() {
    const [splashDone, setSplashDone] = useState(!showSplash)

    return (
        <>
            <App />
            {!splashDone ? (
                <SplashScreen handoffFromOsSplash onFinish={() => setSplashDone(true)} />
            ) : null}
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <Root />
        </ErrorBoundary>
    </React.StrictMode>,
)
