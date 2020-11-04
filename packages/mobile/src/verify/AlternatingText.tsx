import React, { useEffect, useState } from 'react'
import { LayoutAnimation, StyleProp, Text, TextStyle } from 'react-native'

// how often to swap the text
const SHOW_TIME = 2 * 1000 // ms

interface Props {
  style: StyleProp<TextStyle>
  primaryText: string
  secondaryText: string
}

export default function AlternatingText({ style, primaryText, secondaryText }: Props) {
  const [isPrimary, setIsPrimary] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Quick and easy way to animate the state change
      LayoutAnimation.easeInEaseOut()
      setIsPrimary((wasPrimary) => !wasPrimary)
    }, SHOW_TIME)

    return () => clearInterval(interval)
  }, [])

  return <Text style={style}>{isPrimary ? primaryText : secondaryText}</Text>
}
