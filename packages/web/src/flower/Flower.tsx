import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FlowerTablet from 'src/flower/color-flower-mid.jpg'
import FlowerMobile from 'src/flower/color-flower-small.jpg'
import FlowerDesktop from 'src/flower/color-flower.jpg'
import OutlineMobile from 'src/flower/outline-flower-mobile.png'
import OutlineTablet from 'src/flower/outline-flower-tablet.png'
import Outline from 'src/flower/outline-flower.png'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'

export default function Flower() {
  const canvasRef = React.useRef(null)
  const { screen, isMobile } = useScreenSize()
  React.useEffect(() => {
    const viewCtx = canvasRef.current.getContext('2d')
    const canvasHeight = Math.floor(viewCtx.canvas.height)
    const canvasWidth = Math.floor(viewCtx.canvas.width)
    const colorFlower = setImage(viewCtx, canvasWidth, canvasHeight, COLOR_FLOWER_SRC[screen], 1)
    const outlineFlower = setImage(
      viewCtx,
      canvasWidth,
      canvasHeight,
      OUTLINE_FLOWER_SRC[screen],
      0
    )

    const handleScroll = () => {
      requestAnimationFrame(() => {
        viewCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        const percent = getScrollPercent()
        const factor = 1 - percent
        viewCtx.save()

        scaleFromCenter(viewCtx, factor)
        const colorOpacity = isMobile
          ? Math.max(1.25 - percent * 8, 0)
          : Math.max(1.6 - percent * 6, 0)
        viewCtx.globalAlpha = colorOpacity
        viewCtx.drawImage(colorFlower, 0, 0, canvasWidth, canvasHeight)
        viewCtx.restore()

        viewCtx.save()
        scaleFromCenter(viewCtx, factor)
        const opacity = isMobile
          ? Math.max(-0.25 + percent * 8, 0)
          : Math.max(-1.1 + percent * 8, 0)
        viewCtx.globalAlpha = opacity
        viewCtx.drawImage(outlineFlower, 0, 0, canvasWidth, canvasHeight)
        viewCtx.restore()
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [canvasRef, isMobile])

  return (
    <View style={[styles.breathe, isMobile && styles.breatheMobile]}>
      <canvas ref={canvasRef} width="1270" height="1270" style={{ maxWidth: '100%' }} />
    </View>
  )
}

function scaleFromCenter(viewCtx, factor: number) {
  const scale = factor * factor
  const canvasHeight = viewCtx.canvas.height
  const canvasWidth = viewCtx.canvas.width
  const inversion = (1 - scale) / 2

  viewCtx.translate(canvasWidth * inversion, canvasHeight * inversion * 2)
  viewCtx.scale(scale, scale)
}

function setImage(viewCtx, width: number, height: number, path, opacity: number) {
  const image = new Image()

  image.onload = () => {
    viewCtx.save()
    if (opacity === 1) {
      fadeIn(viewCtx, 0, image, width, height)
    } else {
      viewCtx.globalAlpha = opacity
      viewCtx.drawImage(image, 0, 0, width, height)
    }

    viewCtx.restore()
  }
  image.src = path

  return image
}

function getScrollPercent() {
  return window.scrollY / document.scrollingElement.scrollHeight
}

function fadeIn(viewCtx, opacity, image, width, height) {
  requestAnimationFrame(() => {
    viewCtx.save()
    const percent = getScrollPercent()
    const factor = 1 - percent
    scaleFromCenter(viewCtx, factor)
    viewCtx.globalAlpha = opacity + 16 / FADE_IN_MS
    viewCtx.drawImage(image, 0, 0, width, height)
    if (viewCtx.globalAlpha < 1) {
      fadeIn(viewCtx, viewCtx.globalAlpha, image, width, height)
    }
    viewCtx.restore()
  })
}

const FADE_IN_MS = 2000
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
  breatheMobile: {
    marginTop: 40,
    height: 'calc(100vh - 200px)',
    justifyContent: 'flex-start',
  },
  breathe: {
    padding: 20,
    marginTop: 60,
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
