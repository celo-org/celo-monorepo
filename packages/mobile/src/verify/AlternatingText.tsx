import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

// how often to swap the text
const SHOW_TIME = 2 * 1000 // ms

interface Props {
  style: any
  primaryText: string
  secondaryText: string
}

export default function AlternatingText({ style, primaryText, secondaryText }: Props) {
  const [time, setTimer] = useState(0)
  const [isPrimary, setIsPrimary] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1)
      setIsPrimary(time % 2 === 0)
    }, SHOW_TIME)

    return () => clearInterval(interval)
  }, [time, isPrimary])

  return (
    <View>
      {isPrimary && <Text style={style}>{primaryText}</Text>}
      {!isPrimary && <Text style={style}>{secondaryText}</Text>}
    </View>
  )
}
