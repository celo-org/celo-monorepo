import * as React from 'react'
import { Animated, Image, StyleSheet } from 'react-native'
import FlowerTablet from 'src/flower/color-flower-mid.jpg'
import FlowerMobile from 'src/flower/color-flower-small.jpg'
import FlowerDesktop from 'src/flower/color-flower.jpg'
import OutlineMobile from 'src/flower/outline-flower-mobile.png'
import OutlineTablet from 'src/flower/outline-flower-tablet.png'
import Outline from 'src/flower/outline-flower.png'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import { standardStyles } from 'src/styles'

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

function useScroll(handleScroll: (event: Event) => void) {
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

  const skewX = value.interpolate(SKEW)

  const rotate = value.interpolate(ROTATE)
  const rotate2 = value.interpolate(ROTATE2)

  return (
    <Animated.View
      style={[
        styles.breathe,
        isMobile && styles.breatheMobile,
        { transform: [{ rotate: rotate2 }] },
      ]}
    >
      <Animated.View
        style={[
          styles.root,
          isMobile && styles.mobileRoot,
          {
            transform: [{ scale }, { skewX }, { rotate }],
            opacity: isLoaded ? 1 : 0,
          },
        ]}
      >
        <AnimatedRatio ratio={1} style={[styles.outline, { opacity: outlineOpacity }]}>
          <FlowerOutline />
        </AnimatedRatio>
        <AnimatedRatio ratio={1} style={{ opacity: colorOpacity, willChange: 'opacity' }}>
          <FlowerIllo onLoadEnd={showImage} />
        </AnimatedRatio>
      </Animated.View>
    </Animated.View>
  )
}

function FlowerIllo({ onLoadEnd }) {
  const { screen } = useScreenSize()
  return (
    <Image source={COLOR_FLOWER_SRC[screen]} style={standardStyles.image} onLoadEnd={onLoadEnd} />
  )
}

function FlowerOutline() {
  const { screen } = useScreenSize()
  return <Image source={OUTLINE_FLOWER_SRC[screen]} style={standardStyles.image} />
}

const COLOR_FLOWER_SRC = {
  [ScreenSizes.MOBILE]: FlowerMobile,
  [ScreenSizes.TABLET]: FlowerTablet,
  [ScreenSizes.DESKTOP]: FlowerDesktop,
}

const OUTLINE_FLOWER_SRC = {
  [ScreenSizes.MOBILE]: OutlineMobile,
  [ScreenSizes.TABLET]: OutlineTablet,
  [ScreenSizes.DESKTOP]: Outline,
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
    marginTop: 40,
  },
  outline: {
    willChange: 'opacity',
    position: 'absolute',
    width: '100%',
  },
  breatheMobile: {
    height: 'calc(100vh - 50px)',
    justifyContent: 'flex-start',
  },
  breathe: {
    maxWidth: 1270,
    justifyContent: 'center',
    width: '100%',
    willChange: 'transform, opacity',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationDuration: '3s',
    animationFillMode: 'both',
    animationKeyframes: [
      {
        from: { opacity: 0.85, filter: 'brightness(1.1)' },
        '10%': { opacity: 0.85 },
        '90%': { opacity: 1 },
        to: { opacity: 1, filter: 'brightness(1) hue-rotate(-5deg)' },
      },
    ],
  },
})

const COLOR_OPACITY = {
  inputRange: [0, 0.25, 0.3],
  outputRange: [1, 1, 0.1],
}

const COLOR_OPACITY_MOBILE = {
  inputRange: [0, 0.1, 0.16],
  outputRange: [1, 0.5, 0],
}

const OUTLINE_OPACITY = {
  inputRange: [0, 0.25, 0.3, 0.39],
  outputRange: [0, 1, 1, 0],
}

const OUTLINE_OPACITY_MOBILE = {
  inputRange: [0, 0.1, 0.15, 0.22],
  outputRange: [0, 1, 1, 0],
}

const SCALER_DESKTOP = {
  inputRange: [0, 0.15, 0.45],
  outputRange: [1, 0.75, 0.1],
}

const SCALER_MOBILE = {
  inputRange: [0, 0.45],
  outputRange: [1, 0.6],
}

const SKEW = {
  inputRange: [0, 0.27, 0.45, 0.64],
  outputRange: ['0deg', '4deg', '-2deg', '2deg'],
}

const ROTATE = {
  inputRange: [0, 0.66],
  outputRange: ['0deg', '45deg'],
}

const ROTATE2 = {
  inputRange: [0, 0.66],
  outputRange: ['0deg', '18deg'],
}
