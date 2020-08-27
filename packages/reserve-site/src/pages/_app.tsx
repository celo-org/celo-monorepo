import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as Fathom from 'fathom-client'
import getConfig from 'next/config'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const { FATHOM_KEY } = getConfig().publicRuntimeConfig
  useEffect(() => {
    // Initialize Fathom when the app loads
    Fathom.load(FATHOM_KEY, {
      excludedDomains: ['localhost'],
    })

    function onRouteChangeComplete() {
      Fathom.trackPageview()
    }
    // Record a pageview when route changes
    router.events.on('routeChangeComplete', onRouteChangeComplete)

    // Unassign event listener
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [])

  return <Component {...pageProps} />
}
