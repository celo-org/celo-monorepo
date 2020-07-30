import * as React from 'react'
import { Animated, Image, StyleSheet } from 'react-native'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import Outline from 'src/codename-allegory/outline-flower.png'
import AspectRatio from 'src/shared/AspectRatio'
import { standardStyles } from 'src/styles'

const AnimatedRatio = Animated.createAnimatedComponent(AspectRatio)

function useAnimatedScroll() {
  const position = React.useRef(new Animated.Value(0)).current

  const handleScroll = (event) => {
    requestAnimationFrame(() => {
      const percent = window.scrollY / event.target.scrollingElement.scrollHeight
      position.setValue(percent)
    })
  }

  useScroll(handleScroll)

  return position
}

function useScroll(handleScroll: (event: any) => void) {
  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}

export default function Flower() {
  const value = useAnimatedScroll()

  const scale = value.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [1, 0.5, 0.5],
  })

  const opacity = value.interpolate({
    inputRange: [0, 0.05, 0.1, 0.15],
    outputRange: [1, 1, 0.1, 0],
  })

  const translateY = value.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 1],
    outputRange: ['0%', '0%', '50%', '50%', '50%'],
  })

  return (
    <>
      <Animated.View style={[styles.root, { transform: [{ scale }, { translateY }] }]}>
        <AnimatedRatio ratio={1} style={styles.outline}>
          <Image source={Outline} style={standardStyles.image} />
        </AnimatedRatio>
        <AnimatedRatio ratio={1} style={{ opacity }}>
          <Image source={Cambio} style={standardStyles.image} />
        </AnimatedRatio>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: 60,
    maxWidth: 1270,
    width: '100%',
  },
  outline: {
    position: 'absolute',
    width: '100%',
    hieght: '100%',
  },
})
