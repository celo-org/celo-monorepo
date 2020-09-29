import * as React from 'react'
import FlowerTablet from 'src/flower/color-flower-mid.jpg'
import FlowerMobile from 'src/flower/color-flower-small.jpg'
import FlowerDesktop from 'src/flower/color-flower.jpg'
import OutlineMobile from 'src/flower/outline-flower-mobile.png'
import OutlineTablet from 'src/flower/outline-flower-tablet.png'
import Outline from 'src/flower/outline-flower.png'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'

export default function Flower() {
  const canvasRef = React.useRef(null)
  const { screen } = useScreenSize()
  React.useEffect(() => {
    const viewCtx = canvasRef.current.getContext('2d')
    // reset
    const canvasHeight = viewCtx.canvas.height
    const canvasWidth = viewCtx.canvas.width

    const colorFlower = setImage(viewCtx, canvasWidth, canvasHeight, COLOR_FLOWER_SRC[screen], 1)
    const outlineFlower = setImage(
      viewCtx,
      canvasWidth,
      canvasHeight,
      OUTLINE_FLOWER_SRC[screen],
      0
    )

    const handleScroll = (event) => {
      requestAnimationFrame(() => {
        viewCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        const percent = window.scrollY / event?.target?.scrollingElement?.scrollHeight
        const factor = 1 - percent

        viewCtx.save()
        scaleFromCenter(viewCtx, factor)
        const colorOpacity = factor ** 5 + 0.3
        viewCtx.globalAlpha = colorOpacity
        viewCtx.drawImage(colorFlower, 0, 0, canvasWidth, canvasHeight)
        viewCtx.restore()

        viewCtx.save()
        scaleFromCenter(viewCtx, factor)
        const opacity = percent
        console.log(opacity)
        viewCtx.globalAlpha = opacity
        viewCtx.drawImage(outlineFlower, 0, 0, canvasWidth, canvasHeight)
        viewCtx.restore()
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [canvasRef])

  return <canvas ref={canvasRef} width="1270" height="1270" />
}

function scaleFromCenter(viewCtx, factor: number) {
  const scale = factor * factor
  const canvasHeight = viewCtx.canvas.height
  const canvasWidth = viewCtx.canvas.width
  const inversion = 1 - scale
  viewCtx.scale(scale, scale)
  viewCtx.translate(inversion * canvasWidth, inversion * canvasHeight)
}

function setImage(viewCtx, width, height, path, opacity) {
  const image = new Image()

  image.onload = () => {
    viewCtx.save()
    viewCtx.globalAlpha = opacity
    viewCtx.drawImage(image, 0, 0, width, height)
    viewCtx.restore()
  }
  image.src = path

  return image
}

// function FlowerIllo({ onLoadEnd }) {
//   const { screen } = useScreenSize()
//   return (
//     <Image source={COLOR_FLOWER_SRC[screen]} style={standardStyles.image} onLoadEnd={onLoadEnd} />
//   )
// }

// function FlowerOutline() {
//   const { screen } = useScreenSize()
//   return <Image source={OUTLINE_FLOWER_SRC[screen]} style={standardStyles.image} />
// }

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

// const styles = StyleSheet.create({
//   root: {
//     marginTop: 60,
//     width: '100%',
//     willChange: 'transform, opacity',
//     transitionProperty: 'opacity',
//     transitionDuration: '4s',
//     transformOrigin: 'bottom',
//     justifyContent: 'center',
//   },
//   mobileRoot: {
//     transformOrigin: 'bottom',
//     marginTop: 40,
//   },
//   outline: {
//     willChange: 'opacity',
//     position: 'absolute',
//     width: '100%',
//   },
//   breatheMobile: {
//     height: 'calc(100vh - 50px)',
//     justifyContent: 'flex-start',
//   },
//   breathe: {
//     maxWidth: 1270,
//     justifyContent: 'center',
//     width: '100%',
//     willChange: 'transform, opacity',
//     animationIterationCount: 'infinite',
//     animationDirection: 'alternate',
//     animationDuration: '3s',
//     animationFillMode: 'both',
//     animationKeyframes: [
//       {
//         from: { opacity: 0.85, filter: 'brightness(1.1)' },
//         '10%': { opacity: 0.85 },
//         '90%': { opacity: 1 },
//         to: { opacity: 1, filter: 'brightness(1) hue-rotate(-5deg)' },
//       },
//     ],
//   },
// })

// const COLOR_OPACITY = {
//   inputRange: [0, 0.25, 0.3],
//   outputRange: [1, 1, 0.1],
// }

// const COLOR_OPACITY_MOBILE = {
//   inputRange: [0, 0.1, 0.16],
//   outputRange: [1, 0.5, 0],
// }

// const OUTLINE_OPACITY = {
//   inputRange: [0, 0.25, 0.3, 0.39],
//   outputRange: [0, 1, 1, 0],
// }

// const OUTLINE_OPACITY_MOBILE = {
//   inputRange: [0, 0.1, 0.15, 0.22],
//   outputRange: [0, 1, 1, 0],
// }

// const SCALER_DESKTOP = {
//   inputRange: [0, 0.15, 0.45],
//   outputRange: [1, 0.75, 0.1],
// }

// const SCALER_MOBILE = {
//   inputRange: [0, 0.45],
//   outputRange: [1, 0.6],
// }

// const SKEW = {
//   inputRange: [0, 0.27, 0.45, 0.64],
//   outputRange: ['0deg', '4deg', '-2deg', '2deg'],
// }

// const ROTATE = {
//   inputRange: [0, 0.66],
//   outputRange: ['0deg', '45deg'],
// }

// const ROTATE2 = {
//   inputRange: [0, 0.66],
//   outputRange: ['0deg', '18deg'],
// }
