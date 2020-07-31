import * as React from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import Outline from 'src/codename-allegory/outline-flower.png'
import AspectRatio from 'src/shared/AspectRatio'
import { standardStyles } from 'src/styles'
import { useScreenSize } from 'src/layout/ScreenSize'

const AnimatedRatio = Animated.createAnimatedComponent(AspectRatio)

function useAnimatedScroll() {
  const position = React.useRef(new Animated.Value(0)).current

  const handleScroll = (event) => {
    requestAnimationFrame(() => {
      const percent = window.scrollY / event?.target?.scrollingElement?.scrollHeight
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
  const { isMobile } = useScreenSize()
  const value = useAnimatedScroll()

  const scale = value.interpolate(isMobile ? SCALER_MOBILE : SCALER_DESKTOP)

  const colorOpacity = value.interpolate(isMobile ? COLOR_OPACITY_MOBILE : COLOR_OPACITY)

  const outlineOpacity = value.interpolate(isMobile ? OUTLINE_OPACITY_MOBILE : OUTLINE_OPACITY)

  const translateY = value.interpolate(isMobile ? POSITIONING_MOBILE : POSITIONING_DESKTOP)

  return (
    <View style={styles.breathe}>
      <Animated.View
        style={[
          styles.root,
          isMobile && styles.mobileRoot,
          { transform: [{ scale }, { translateY }] },
        ]}
      >
        <AnimatedRatio ratio={1} style={[styles.outline, { opacity: outlineOpacity }]}>
          <Image source={Outline} style={standardStyles.image} />
        </AnimatedRatio>
        <AnimatedRatio ratio={1} style={{ opacity: colorOpacity }}>
          <Image source={Cambio} style={standardStyles.image} />
        </AnimatedRatio>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: 60,
    width: '100%',
    willChange: 'transform, opacity',
    transformOrigin: 'center',
    justifyContent: 'center',
  },
  mobileRoot: {
    transformOrigin: 'bottom',
    marginTop: 0,
    height: 'calc(100vh - 75px)',
  },
  outline: {
    position: 'absolute',
    width: '100%',
  },
  breathe: {
    maxWidth: 1270,
    justifyContent: 'center',
    width: '100%',
    animationIterationCount: 100,
    animationDirection: 'alternate',
    animationDuration: '3s',
    animationFillMode: 'both',
    animationKeyframes: [
      {
        from: { opacity: 0.6 },
        '10%': { opacity: 0.6 },
        '90%': { opacity: 1 },
        to: { opacity: 1, transform: [{ scale: 1.01 }] },
      },
    ],
  },
})
const COLOR_OPACITY = {
  inputRange: [0, 0.1, 0.15, 0.2],
  outputRange: [1, 1, 0.1, 0],
}

const COLOR_OPACITY_MOBILE = {
  inputRange: [0, 0.15, 0.2],
  outputRange: [1, 0.1, 0],
}

const OUTLINE_OPACITY = {
  inputRange: [0, 0.05, 0.175, 0.3],
  outputRange: [0, 0, 1, 0],
}

const OUTLINE_OPACITY_MOBILE = {
  inputRange: [0, 0.05, 0.175, 0.2],
  outputRange: [0, 0, 1, 0],
}

const SCALER_DESKTOP = {
  inputRange: [0, 0.1, 0.2, 0.3, 1],
  outputRange: [1, 0.5, 0.5, 0.35, 0.3],
}

const SCALER_MOBILE = {
  inputRange: [0, 0.1, 0.2, 1],
  outputRange: [1, 1, 0.5, 0.3],
}

const POSITIONING_DESKTOP = {
  inputRange: [0, 0.1, 0.2, 0.35, 1],
  outputRange: ['0%', '0%', '50%', '150%', '300%'],
}

const POSITIONING_MOBILE = {
  inputRange: [0, 0.1, 0.5, 1],
  outputRange: ['0%', '0%', '25%', '100%'],
}
