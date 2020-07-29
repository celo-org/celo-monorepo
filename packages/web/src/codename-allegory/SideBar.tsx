import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { textStyles, fonts } from 'src/styles'
import Button, { BTN, SIZE } from 'src/shared/Button.3'

export default function SideBar({ isOpen }) {
  return (
    <View style={[styles.root, isOpen ? styles.showSide : styles.hideSide]}>
      <View>
        <H4 style={textStyles.italic}>As Wealth Flowers</H4>
        <Text style={fonts.p}>
          A poem and art piece that... Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
          do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
          quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Text>
        <Button
          kind={BTN.DARKNAKED}
          text="Read about the poem"
          href="#poemlink"
          size={SIZE.normal}
        />
        <Button kind={BTN.DARKNAKED} text="Read about the art" href="#artlink" size={SIZE.normal} />
      </View>
      <View>
        <Contributor role="Poetry" name="Gabrielle Micheletti, cLabs" />
        <Contributor role="Code & Animation" name="Aaron DeRuvo, cLabs" />
        <Contributor role="Art & Design" name="Taylor Lahey, cLabs" />
      </View>
    </View>
  )
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
  root: {
    justifyContent: 'space-between',
    height: 'calc(100vh - 90px)',
    willChange: 'width,transform, opacity',
    transitionProperty: 'width, transform, opacity',
    transitionDuration: '600ms',
  },
  showSide: {
    width: 270,
    marginHorizontal: 24,
  },
  hideSide: {
    transform: [{ translateX: 300 }],
    width: 0,
    opacity: 0.5,
  },
  role: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  contributor: {
    marginBottom: 10,
  },
})
