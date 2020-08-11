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
  const [isLoaded, setIsLoaded] = React.useState(false)

  function showImage() {
    setIsLoaded(true)
  }

  const { isMobile } = useScreenSize()
  const value = useAnimatedScroll()

  const scale = value.interpolate(isMobile ? SCALER_MOBILE : SCALER_DESKTOP)

  const colorOpacity = value.interpolate(isMobile ? COLOR_OPACITY_MOBILE : COLOR_OPACITY)

  const outlineOpacity = value.interpolate(isMobile ? OUTLINE_OPACITY_MOBILE : OUTLINE_OPACITY)

  const translateY = value.interpolate(isMobile ? POSITIONING_MOBILE : POSITIONING_DESKTOP)

  const skewX = value.interpolate(SKEW)

  const rotate = value.interpolate(ROTATE)

  return (
    <View style={[styles.breathe, isMobile && styles.breatheMobile]}>
      <Animated.View
        style={[
          styles.root,
          isMobile && styles.mobileRoot,
          {
            transform: [{ scale }, { translateY }, { skewX }, { rotate }],
            opacity: isLoaded ? 1 : 0,
          },
        ]}
      >
        <AnimatedRatio ratio={1} style={[styles.outline, { opacity: outlineOpacity }]}>
          <Image source={Outline} style={standardStyles.image} />
        </AnimatedRatio>
        <AnimatedRatio ratio={1} style={{ opacity: colorOpacity }}>
          <Image source={Cambio} style={standardStyles.image} onLoadEnd={showImage} />
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
    transitionProperty: 'opacity',
    transitionDuration: '4s',
    transformOrigin: 'bottom',
    justifyContent: 'center',
  },
  mobileRoot: {
    transformOrigin: 'bottom',
    marginTop: 0,
  },
  outline: {
    position: 'absolute',
    width: '100%',
  },
  breatheMobile: {
    height: 'calc(100vh - 50px)',
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
        from: { opacity: 0.7 },
        '10%': { opacity: 0.7 },
        '90%': { opacity: 1 },
        to: { opacity: 1, transform: [{ scale: 1.01 }] },
      },
    ],
  },
})

const COLOR_OPACITY = {
  inputRange: [0, 0.15, 0.25],
  outputRange: [1, 1, 0.1],
}

const COLOR_OPACITY_MOBILE = {
  inputRange: [0, 0.15, 0.25],
  outputRange: [1, 1, 0.1],
}

const OUTLINE_OPACITY = {
  inputRange: [0, 0.1, 0.3, 0.4],
  outputRange: [0, 1, 1, 0],
}

const OUTLINE_OPACITY_MOBILE = {
  inputRange: [0, 0.1, 0.3, 0.4],
  outputRange: [0, 1, 1, 0],
}

const SCALER_DESKTOP = {
  inputRange: [0, 0.1, 0.5],
  outputRange: [1, 0.75, 0.1],
}

const SCALER_MOBILE = {
  inputRange: [0, 1],
  outputRange: [1, 0.75],
}

const POSITIONING_DESKTOP = {
  inputRange: [0, 0.1, 0.5],
  outputRange: ['0%', '1%', '30%'],
}

const POSITIONING_MOBILE = {
  inputRange: [0, 0.1, 0.5],
  outputRange: ['0%', '10%', '40%'],
}

const SKEW = {
  inputRange: [0, 0.27, 0.45, 0.66],
  outputRange: ['0deg', '4deg', '-2deg', '2deg'],
}

const ROTATE = {
  inputRange: [0, 0.66],
  outputRange: ['0deg', '45deg'],
}
