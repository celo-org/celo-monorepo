import Dynamic from 'next/dynamic'
import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import Fade, { Direction } from 'src/shared/AwesomeFade'
import Responsive from 'src/shared/Responsive'
import Spinner from 'src/shared/Spinner'
import { DESKTOP_BREAKPOINT, TABLET_BREAKPOINT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const Carousel = Dynamic(import('nuka-carousel'), {
  loading: () => (
    <View style={[standardStyles.centered]}>
      <Cell image={placeholder} imageWidth={IMAGE_WIDTHS[ScreenSize.TABLET]} />
    </View>
  ),
  ssr: false,
})

const CarouselDot = Dynamic(import('src/home/carousel/CarouselDot'), {
  ssr: false,
})

const Cell = ({ image: { image, width, height, caption }, imageWidth }) => {
  const imageHeight = (height * imageWidth) / width
  return (
    <Responsive medium={[styles.cell, styles.cellMedium]} large={[styles.cell, styles.cellLarge]}>
      <View style={styles.cell}>
        <FadeIn
          offset={600}
          height={imageHeight}
          placeholder={
            <View style={[standardStyles.centered, styles.placeholder]}>
              <Spinner size="medium" color={colors.primary} />
            </View>
          }
        >
          {(onload) => (
            <Image
              onLoad={onload}
              style={{ height: imageHeight, width: imageWidth }}
              source={image}
            />
          )}
        </FadeIn>
        <Text style={[fonts.legal, textStyles.caption]}>{caption}</Text>
      </View>
    </Responsive>
  )
}

const Dot = ({ show, text }) => {
  return (
    <View pointerEvents="none" style={[styles.dotContainer, !show && { display: 'none' }]}>
      <View style={styles.dot}>
        <CarouselDot text={text} />
      </View>
    </View>
  )
}

const placeholder = {
  height: 300,
  width: 450,
  image: '',
  caption: '',
}

const images = [
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/01-nam-question@2x.jpg'),
    caption: 'Nam asking a question at our All Hands meeting',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/02-vanessa-interview@2x.jpg'),
    caption: 'Vanessa conducting design research interviews in Kenya',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/03-onboarding-users-argentina@2x.jpg'),
    caption: 'Marek onboarding users in Argentina',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/04-anna-onboarding@2x.jpg'),
    caption: 'Anna onboarding merchants in the Philippines',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/05-clair-slush@2x.jpg'),
    caption: 'Claire onstage at Slush Conference, photo by Julius Konttinen',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/06-non-violent-comms@2x.jpg'),
    caption:
      'Investing in our growth and development with a workshop on compassionate communication',
  },
  {
    height: 300,
    width: 450,
    image: require('src/home/carousel/07-lila@2x.jpg'),
    caption: 'Lila, our resident pup, posing for the camera',
  },
]

enum ScreenSize {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
}

const IMAGE_WIDTHS = {
  [ScreenSize.MOBILE]: 300,
  [ScreenSize.TABLET]: 375,
  [ScreenSize.DESKTOP]: 650,
}

const CELL_SPACING = {
  [ScreenSize.MOBILE]: 25,
  [ScreenSize.TABLET]: 50,
  [ScreenSize.DESKTOP]: 100,
}

const DOT_TEXT = {
  [ScreenSize.MOBILE]: 'Swipe',
  [ScreenSize.TABLET]: 'Swipe',
  [ScreenSize.DESKTOP]: 'Drag',
}

class HomeCarousel extends React.Component {
  state = {
    screenSize: ScreenSize.MOBILE,
    showDot: true,
  }

  componentDidMount() {
    this.windowResize({ window: Dimensions.get('window') })
    Dimensions.addEventListener('change', this.windowResize)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.windowResize)
  }

  windowResize = ({ window: { width } }) => {
    const screenSize = this.getScreenSize(width)
    if (screenSize !== this.state.screenSize) {
      this.setState({ screenSize })
    }
  }

  getScreenSize = (width: number) => {
    if (width >= DESKTOP_BREAKPOINT) {
      return ScreenSize.DESKTOP
    } else if (width >= TABLET_BREAKPOINT) {
      return ScreenSize.TABLET
    }
    return ScreenSize.MOBILE
  }

  hideDot = () => {
    if (this.state.showDot === true) {
      this.setState({ showDot: false })
    }
  }

  render() {
    const imageWidth = IMAGE_WIDTHS[this.state.screenSize]
    const cellSpacing = CELL_SPACING[this.state.screenSize]
    const text = DOT_TEXT[this.state.screenSize]

    return (
      <View style={styles.container}>
        <Carousel
          dragging={true}
          swiping={true}
          cellAlign="center"
          slideWidth={`${imageWidth}px`}
          initialSlideHeight={DESKTOP_MAX_HEIGHT}
          cellSpacing={cellSpacing}
          heightMode="max"
          withoutControls={true}
          enableKeyboardControls={true}
          edgeEasing="easePoly"
          easing="easeExpOut"
          onDragStart={this.hideDot}
          speed={500}
        >
          {images.map((image, index) => (
            <View key={index}>
              {index < 2 ? (
                <Fade direction={Direction.X} distance="-40px" delay={200}>
                  <Cell key={index} image={image} imageWidth={imageWidth} />
                </Fade>
              ) : (
                <Cell key={index} image={image} imageWidth={imageWidth} />
              )}
            </View>
          ))}
        </Carousel>
        <Dot show={this.state.showDot} text={text} />
        <View pointerEvents="none" style={styles.overlay} />
      </View>
    )
  }
}

const TEXT_PADDING = 50
const DESKTOP_MAX_HEIGHT = 500
const MOBILE_MAX_HEIGHT = DESKTOP_MAX_HEIGHT * (300 / 450)
const TABLET_MAX_HEIGHT = DESKTOP_MAX_HEIGHT * (375 / 450)
const CONTAINER_PADDING_TOP = 0
const CONTAINER_PADDING_BOTTOM = 0

const styles = StyleSheet.create({
  placeholder: { height: '100%', flex: 1 },
  container: {
    flex: 1,
    paddingTop: CONTAINER_PADDING_TOP,
    paddingBottom: CONTAINER_PADDING_BOTTOM,
  },
  cell: {
    height: MOBILE_MAX_HEIGHT + TEXT_PADDING,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  cellMedium: {
    height: TABLET_MAX_HEIGHT + TEXT_PADDING,
  },
  cellLarge: {
    height: DESKTOP_MAX_HEIGHT + TEXT_PADDING,
  },
  dotContainer: {
    position: 'absolute',
    top: CONTAINER_PADDING_TOP,
    left: 0,
    right: 0,
    bottom: CONTAINER_PADDING_BOTTOM + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    // @ts-ignore
    transformOrigin: 'middle right',
    animationDuration: '3s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'easeOut',
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
          transform: [
            {
              translateX: 50,
            },
            {
              scaleX: 0.4,
            },
            {
              scaleY: 0.4,
            },
          ],
        },
        '37%': {
          opacity: 1,
          transform: [
            {
              translateX: 0,
            },
            {
              scaleX: 1,
            },
            {
              scaleY: 1,
            },
          ],
        },
        '69%': {
          transform: [
            {
              translateX: -70,
            },
          ],
        },
        '100%': {
          opacity: 0,
          transform: [
            {
              translateX: -70,
            },
          ],
        },
      },
    ],
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // @ts-ignore
    backgroundImage:
      'linear-gradient(to right, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0) 90%, rgba(255, 255, 255, 0.6) 100%)',
  },
})

export default HomeCarousel
