import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, interpolate } from 'react-native-reanimated'
import { circularProgressBig } from 'src/images/Images'
import { loop } from 'src/utils/reanimated'

const TOTAL_TIME = 2 * 60 * 1000 // 2 minutes in milliseconds

// Formats seconds to m:ss
function formatTimeRemaining(seconds: number) {
  if (seconds < 0) {
    seconds = 0
  }

  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)

  return m + ':' + String(s).padStart(2, '0')
}

interface Props {
  onFinish: () => void
}

export default function VerificationCountdown({ onFinish }: Props) {
  const hasCalledOnFinishRef = useRef(false)
  const endTime = useRef(Date.now() + TOTAL_TIME).current
  // Used for re-rendering, actual value unused
  const [, setTimer] = useState(0)

  const progressAnimatedStyle = useMemo(() => {
    const progress = loop({
      duration: 1000,
      easing: Easing.linear,
      autoStart: true,
    })
    const rotate = interpolate(progress, {
      inputRange: [0, 1],
      outputRange: [0, 2 * Math.PI],
    })

    return {
      transform: [{ rotate }],
    }
  }, [])

  const secondsLeft = (endTime - Date.now()) / 1000

  // Update timer effect
  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }

    const interval = setInterval(() => {
      setTimer((timer) => timer + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft <= 0])

  // Effect to call onFinish when appropriate
  useEffect(() => {
    if (secondsLeft <= 0 && !hasCalledOnFinishRef.current) {
      hasCalledOnFinishRef.current = true
      onFinish()
    }
  }, [secondsLeft <= 0, onFinish])

  return (
    <Animated.View>
      <Animated.Image source={circularProgressBig} style={progressAnimatedStyle} />
      <View style={styles.content}>
        <Text style={styles.text}>{formatTimeRemaining(secondsLeft)}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...fontStyles.large,
    fontSize: 40,
    lineHeight: 48,
    color: colors.onboardingBrownLight,
    fontVariant: ['tabular-nums'],
  },
})
