import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size: number
}

export default React.memo(function DrawCoinLight({ size }: Props) {
  return (
    <Image
      resizeMode="contain"
      source={require('src/icons/draw-coin-light-bg.png')}
      style={{ width: size, height: size }}
    />
  )
})
