import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { useCopyToClipboard } from 'src/hooks/useCopyToClipboard'
import Chainlink from 'src/icons/Chainlink'
import { TweetLogo } from 'src/icons/TwitterLogo'
import { useScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { colors, fonts, standardStyles, textStyles, typeFaces } from 'src/styles'
import LightButton from './LightButton'

const WIDTH = 340

export default function SideBar({ isOpen }) {
  const { isMobile } = useScreenSize()
  const openStyle = isMobile ? styles.showSideMobile : styles.showSide
  const closedStyle = isMobile ? styles.hideSideMobile : styles.hideSide
  return (
    <>
      <View style={[styles.expander, !isMobile && isOpen && styles.expanderOpen]} />
      <View style={[styles.root, isMobile && styles.rootMobile, isOpen ? openStyle : closedStyle]}>
        <View>
          <H4
            style={[
              textStyles.italic,
              standardStyles.elementalMarginBottom,
              isMobile && styles.mobileTitle,
            ]}
          >
            For Value Flowers
          </H4>
          <Text style={[fonts.p, styles.aside]}>
            This art form is a testament to the creative trinity of code, poetry, and illustration.
            As a work centered around channelling the Celo story,{' '}
            <Text style={textStyles.italic}>For Value Flowers</Text> is a gift of optimism. It gives
            shape to a spirit of collective prosperity, and celebrates it when brought to life.
          </Text>
          <Text style={[fonts.p, styles.aside, standardStyles.elementalMarginTop]}>
            Our intention for this gift is to ground a space for a special, expressive tone of
            togetherness, our 'Kuneco'. Here, we gather — for the intimate connection that forms the
            heart of communal interdependence, dedicated to making the conditions for prosperity to
            flower throughout the world.
          </Text>
          <View style={standardStyles.elementalMarginTop}>
            <Button
              style={styles.chevronButton}
              kind={BTN.DARKNAKED}
              text="Read about the poem"
              href="https://medium.com/celoorg/a-celebration-of-heart-for-celo-44bbbba94a2c"
              size={SIZE.normal}
            />
            {/* <Button
              kind={BTN.DARKNAKED}
              text="Read about the art"
              href="#artlink"
              style={styles.chevronButton}
              size={SIZE.normal}
            /> */}
          </View>
          <View style={[standardStyles.row, standardStyles.elementalMargin]}>
            <TweetButton />
            <CopyButton />
          </View>
        </View>
        <View style={standardStyles.blockMarginBottomMobile}>
          <View style={[styles.line, standardStyles.elementalMarginBottom]} />
          <Contributor role="Poetry" name="Gabrielle Micheletti" />
          <Contributor role="Code & Animation" name="Aaron DeRuvo" />
          <Contributor role="Art & Design" name="Taylor Lahey" />
        </View>
      </View>
    </>
  )
}

function CopyButton() {
  const [justCopied, copyText] = useCopyToClipboard()

  function copyURL() {
    copyText(window.location.href)
  }

  return (
    <LightButton onPress={copyURL} style={styles.copyButton}>
      <Chainlink size={16} color={colors.dark} />
      <View style={{ marginLeft: 5 }}>
        <Text
          style={[
            styles.copyButtonText,
            justCopied ? styles.copyButtonTextHiding : styles.copyButtonTextShowing,
          ]}
        >
          Copy
        </Text>
        <Text
          style={[
            styles.copyButtonText,
            justCopied ? styles.copyButtonTextShowing : styles.copyButtonTextHiding,
          ]}
        >
          Copied
        </Text>
      </View>
    </LightButton>
  )
}

const TweetButton = React.memo(() => {
  const text = encodeURI('Blooming more beautiful money — for value flowers 🌺')
  const url = 'celo.org/flowers'
  return (
    <>
      <LightButton
        href={`https://twitter.com/intent/tweet?hashtags=celoflora&related=celoOrg&via=celoOrg&text=${text}&url=${url}`}
      >
        <TweetLogo height={16} color={colors.dark} /> Tweet
      </LightButton>
    </>
  )
})

function Contributor({ role, name }) {
  return (
    <View style={styles.contributor}>
      <Text style={[fonts.mini, styles.role]}>{role}</Text>
      <Text style={fonts.legal}>{name}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  expander: {
    width: 0,
    willChange: 'width',
    transitionProperty: 'width',
    transitionDuration: '1300ms',
  },
  expanderOpen: {
    transitionDuration: '1200ms',
    width: WIDTH,
  },
  root: {
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    minHeight: 'calc(100vh - 50px)',
    willChange: 'opacity',
    transitionProperty: 'opacity, transform',
    width: WIDTH,
    position: 'absolute',
    right: 0,
  },
  rootMobile: {
    willChange: 'opacity, transform',
    transitionProperty: 'opacity, transform',
    transitionDuration: '800ms',
    width: '100vw',
  },
  showSideMobile: {
    transitionDelay: '600ms',
    height: 400,
    minHeight: 'calc(100vh - 50px)',
    overflow: 'scroll',
    width: '100vw',
    transform: [{ translateY: 0 }],
    opacity: 1,
  },
  hideSideMobile: {
    opacity: 0,
    transform: [{ translateY: 5 }],
    zIndex: -20,
  },
  showSide: {
    transitionDuration: '800ms',
    transitionDelay: '400ms',
    opacity: 1,
    transform: [{ translateX: 0 }],
  },
  hideSide: {
    transitionProperty: 'opacity, transform',
    transitionDuration: '800ms',
    opacity: 0,
    transform: [{ translateX: 120 }],
  },
  role: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 4,
    lineHeight: 20,
    marginBottom: 4,
  },
  contributor: {
    marginBottom: 16,
  },
  line: {
    width: 26,
    height: 1,
    backgroundColor: colors.dark,
  },
  copyButton: { marginLeft: 10 },
  copyButtonText: {
    transitionDuration: '400ms',
    transitionProperty: 'opacity, width',
  },
  copyButtonTextHiding: {
    transform: [{ scaleX: 0 }],
    width: 0,
    height: 0,
    opacity: 0,
  },
  copyButtonTextShowing: {
    transform: [{ scaleX: 1 }],
    opacity: 1,
  },
  aside: {
    fontSize: 18,
    lineHeight: 24,
  },
  chevronButton: {
    fontFamily: typeFaces.garamond,
    fontWeight: 'bold',
    marginTop: 20,
  },
  mobileTitle: {
    fontSize: 30,
  },
})
