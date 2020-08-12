import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React, { useEffect, useRef, useState } from 'react'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'

// How long the last entered digit is visible
const LAST_DIGIT_VISIBLE_INTERVAL = 2000 // 2secs

const DOT_SIZE = 8

interface Props {
  pin: string
  maxLength: number
}

export default function PincodeDisplay({ pin, maxLength }: Props) {
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
        duration: 150,
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
        const char = index === revealIndex ? pin[index] : undefined
        const isEntered = index < pin.length
        const key = `${index}_${isEntered}_${char}`

        return (
          <View key={key} style={styles.inputContainer}>
            {char ? (
              <Text style={styles.char}>{char}</Text>
            ) : (
              <View style={[styles.dot, isEntered && styles.dotFilled]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    height: fontStyles.h1.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {
    ...fontStyles.h1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.dark,
  },
  dotFilled: {
    backgroundColor: colors.dark,
  },
})
