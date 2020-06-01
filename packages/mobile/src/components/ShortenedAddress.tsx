import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'

interface Props {
  style: StyleProp<TextStyle>
  address: string
}

export default function ShortenedAddress({ style, address }: Props) {
  return <Text style={style}>{`${address.slice(0, 6)}...${address.slice(-4)}`}</Text>
}
