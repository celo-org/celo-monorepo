import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Hero from 'src/blue-owl/hero.png'

export default function Cover() {
  return (
    <View style={styles.root}>
      <Image source={Hero} style={styles.image} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: '#1652EB',
    height: 450,
    alignItems: 'center',
  },
  image: {
    maxWidth: 1050,
    minWidth: 600,
    width: '100%',
    height: '100%',
  },
})
