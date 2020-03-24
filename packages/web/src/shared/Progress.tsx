import { useRouter } from 'next/router'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from 'src/styles'
import { EffectiveTypes, getEffectiveConnection } from 'src/utils/utils'

// https://nextjs.org/docs/api-reference/next/router#router-api
enum RouterEvents {
  routeChangeStart = 'routeChangeStart',
  routeChangeComplete = 'routeChangeComplete',
  routeChangeError = 'routeChangeError',
}

export function usePageTurner() {
  const router = useRouter()
  const [isPageTurning, setPageTurning] = React.useState(false)
  const [hasError, setError] = React.useState(false)
  const [route, setRoute] = React.useState('')
  React.useEffect(() => {
    const eventHandlers = {
      [RouterEvents.routeChangeStart]: (url) => {
        setPageTurning(true)
        setError(false)
        setRoute(url)
      },
      [RouterEvents.routeChangeComplete]: () => {
        setTimeout(() => setPageTurning(false), 300)
        setError(false)
      },
      [RouterEvents.routeChangeError]: (error: { cancelled: boolean }, url: string) => {
        if (error.cancelled) {
          setRoute(url)
        }
        setError(true)
      },
    }

    Object.keys(RouterEvents).forEach((eventType) => {
      router.events.on(eventType, eventHandlers[eventType])
    })

    return () => {
      Object.keys(RouterEvents).forEach((eventType) => {
        router.events.off(eventType, eventHandlers[eventType])
      })
    }
  }, [])

  return { isPageTurning, hasError, route }
}

export default function Progress() {
  const { isPageTurning, hasError, route } = usePageTurner()

  if (isPageTurning) {
    const speed = getEffectiveConnection(navigator)
    const animationSpeed = styles[speed]
    return (
      <View style={styles.container} key={route}>
        <View style={[styles.bar, animationSpeed, hasError ? styles.bad : styles.good]} />
      </View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    height: 2,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  [EffectiveTypes['slow-2g']]: {
    animationDuration: `30s`,
  },
  [EffectiveTypes['2g']]: {
    animationDuration: `20s`,
  },
  [EffectiveTypes.unknown]: {
    animationDuration: `12s`,
  },
  [EffectiveTypes['3g']]: {
    animationDuration: `15s`,
  },
  [EffectiveTypes['4g']]: {
    animationDuration: `5s`,
  },
  good: {
    backgroundColor: colors.primary,
  },
  bad: {
    backgroundColor: colors.red,
  },
  bar: {
    transformProperty: 'background-color',
    transformDuration: '1s',
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0,.58,.51,1.01)',
    animationKeyframes: [
      {
        '0%': {
          transform: [{ scaleX: 0 }],
        },

        '100%': {
          transform: [{ scaleX: 1 }],
        },
      },
    ],
  },
})
