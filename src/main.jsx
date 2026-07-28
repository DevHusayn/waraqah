import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import { initMonitoring } from './monitoring/sentry.js'
import { hasSeenSplash, markSplashSeen, removeStaticSplash } from './utils/splashSession.js'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

initMonitoring()

registerSW({ immediate: true })

function Root() {
    const [splashDone, setSplashDone] = useState(hasSeenSplash)

    useEffect(() => {
        if (splashDone) {
            removeStaticSplash()
        }
    }, [splashDone])

    const handleSplashFinish = () => {
        markSplashSeen()
        removeStaticSplash()
        setSplashDone(true)
    }

    return (
        <>
            <div style={splashDone ? undefined : { visibility: 'hidden' }}>
                <App />
            </div>
            {!splashDone ? <SplashScreen onFinish={handleSplashFinish} /> : null}
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
