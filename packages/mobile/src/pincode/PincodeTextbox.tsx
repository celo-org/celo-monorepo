import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React, { useEffect, useRef, useState } from 'react'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'

// How long the last entered digit is visible
const LAST_DIGIT_VISIBLE_INTERVAL = 2000 // 2secs

interface Props {
  pin: string
  maxLength: number
}

export default function PincodeTextbox({ pin, maxLength }: Props) {
  const [revealIndex, setRevealIndex] = useState(-1)
  const prevPinRef = useRef(pin)

  useEffect(() => {
    const prevPin = prevPinRef.current
    prevPinRef.current = pin

    // Check if pin length is smaller, so as not to reveal previous digits
    // when deleting
    if (pin.length < prevPin.length) {
      LayoutAnimation.configureNext({
        ...LayoutAnimation.Presets.easeInEaseOut,
        duration: 100,
      })
      setRevealIndex(-1)
      return
    }

    setRevealIndex(pin.length - 1)
    const timeout = setTimeout(() => {
      LayoutAnimation.easeInEaseOut()
      setRevealIndex(-1)
    }, LAST_DIGIT_VISIBLE_INTERVAL)

    return () => {
      clearTimeout(timeout)
    }
  }, [pin])

  return (
    <View style={styles.container}>
      {Array.from({ length: maxLength }).map((x, index) => {
        const char = index === revealIndex ? pin[index] : '•'
        const isEntered = index < pin.length
        return (
          <Text
            key={`${index}_${char}_${isEntered}`}
            style={[styles.char, isEntered && styles.charEntered]}
          >
            {char}
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  char: {
    ...fontStyles.h1,
    textAlign: 'center',
    flex: 1,
    color: colors.onboardingBrown,
    opacity: 0.2,
  },
  charEntered: {
    color: colors.dark,
    opacity: 1,
  },
})
