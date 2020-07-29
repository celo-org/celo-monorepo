import * as React from 'react'
import { Image, StyleSheet } from 'react-native'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import AspectRatio from 'src/shared/AspectRatio'
import { standardStyles } from 'src/styles'

export default function Flower() {
  return (
    <AspectRatio ratio={1} style={styles.flower}>
      <Image source={Cambio} style={standardStyles.image} />
    </AspectRatio>
  )
}

const styles = StyleSheet.create({
  flower: {
    marginTop: 60,
    maxWidth: 1270,
    width: '100%',
  },
})
