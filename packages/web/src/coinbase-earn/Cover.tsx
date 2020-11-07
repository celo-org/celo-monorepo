import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import HeroMobile from 'src/coinbase-earn/hero-mobile.png'
import Hero from 'src/coinbase-earn/hero.png'
import { useScreenSize } from 'src/layout/ScreenSize'

export default function Cover() {
  const { isMobile } = useScreenSize()
  return (
    <View style={[styles.root, isMobile && styles.rootMobile]}>
      <Image
        source={isMobile ? HeroMobile : Hero}
        style={isMobile ? styles.imageMobile : styles.image}
      />
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
  rootMobile: {
    height: 360,
    maxHeight: '50vh',
  },
  image: {
    maxWidth: 1050,
    minWidth: 600,
    width: '100%',
    height: '100%',
  },
  imageMobile: {
    width: '100vw',
    height: '100%',
  },
})
