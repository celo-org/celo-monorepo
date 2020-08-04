import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { textStyles, fonts, standardStyles, colors } from 'src/styles'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import LightButon from './LightButton'
import { TweetLogo } from 'src/icons/TwitterLogo'
import Chainlink from 'src/icons/Chainlink'
import { useScreenSize } from 'src/layout/ScreenSize'
import { copyToClipboad } from 'src/utils/utils'

export default function SideBar({ isOpen }) {
  const { isMobile } = useScreenSize()
  const openStyle = isMobile ? styles.showSideMobile : styles.showSide
  return (
    <>
      <View style={[styles.expander, isOpen && styles.expanderOpen]} />
      <View style={[styles.root, isOpen ? openStyle : styles.hideSide]}>
        <View>
          <H4 style={[textStyles.italic, standardStyles.elementalMarginBottom]}>
            As Wealth Flowers
          </H4>
          <Text style={fonts.p}>
            This art form is a testament to creative biunity of poetry and illustration. ‘Kuneco’ is
            an Esperanto word signifying togetherness, and this communal interdependence forms the
            heart of the creators’ work from within Celo. As a sacred gift, the spirit embodied
            within this art piece gathers a space for intimate connection and an expressive tenor of
            togetherness — in dedication to making conditions for collective prosperity to flower
            throughout the world.
          </Text>
          <Button
            style={standardStyles.elementalMargin}
            kind={BTN.DARKNAKED}
            text="Read about the poem"
            href="#poemlink"
            size={SIZE.normal}
          />
          <Button
            kind={BTN.DARKNAKED}
            text="Read about the art"
            href="#artlink"
            size={SIZE.normal}
          />
          <View style={[standardStyles.row, standardStyles.elementalMargin]}>
            <LightButon>
              <TweetLogo height={14} color={colors.dark} /> Tweet
            </LightButon>
            <LightButon onPress={copyURL} style={styles.copyButton}>
              <Chainlink size={16} color={colors.dark} /> Copy
            </LightButon>
          </View>
        </View>
        <View style={standardStyles.elementalMargin}>
          <View style={[styles.line, standardStyles.elementalMarginBottom]} />
          <Contributor role="Poetry" name="Gabrielle Micheletti, cLabs" />
          <Contributor role="Code & Animation" name="Aaron DeRuvo, cLabs" />
          <Contributor role="Art & Design" name="Taylor Lahey, cLabs" />
        </View>
      </View>
    </>
  )
}

function copyURL() {
  copyToClipboad(window.location.href)
}

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
    transitionDuration: '600ms',
  },
  expanderOpen: {
    width: 270,
  },
  root: {
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    minHeight: 'calc(100vh - 50px)',
    willChange: 'transform, opacity',
    transitionProperty: 'transform, opacity',
    transitionDuration: '600ms',
    width: 270,
    position: 'absolute',
    right: 0,
  },
  showSideMobile: {
    height: 400,
    minHeight: 'calc(100vh - 50px)',
    overflow: 'scroll',
    width: '100vw',
    paddingHorizontal: 16,
  },
  showSide: {
    marginHorizontal: 24,
    opacity: 1,
  },
  hideSide: {
    transform: [{ translateX: 300 }],
    opacity: 0.1,
  },
  role: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  contributor: {
    marginBottom: 10,
  },
  line: {
    width: 26,
    height: 1,
    backgroundColor: colors.dark,
  },
  copyButton: { marginLeft: 10 },
})
