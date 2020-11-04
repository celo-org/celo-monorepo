import { Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'

// how often to swap the text
const SHOW_TIME = 2 * 1000 // ms

interface Props {
  style: any
  primaryText: string
  secondaryText: string
}

export default function AlternatingText({ style, primaryText, secondaryText }: Props) {
  const [timer, setTimer] = useState(0)
  const [isPrimary, setIsPrimary] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((timer) => timer + 1)
      setIsPrimary(timer % 2 === 0)
      console.log(timer, isPrimary)
    }, SHOW_TIME)

    return () => clearInterval(interval)
  }, [timer, isPrimary])

  return (
    <View>
      {isPrimary && <Text style={style}>{primaryText}</Text>}
      {!isPrimary && <Text style={style}>{secondaryText}</Text>}
    </View>
  )
}
