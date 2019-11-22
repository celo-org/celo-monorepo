import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { GAP } from 'src/brandkit/common/constants'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, fonts, standardStyles } from 'src/styles'

export enum Logos {
  dark,
  light,
  white,
  black,
}

interface Props {
  caption: string
  background: colors
  logoType: Logos
  btnText: string
}

export default React.memo(function LogoExample({ btnText, caption, background, logoType }: Props) {
  const useLight = logoType === Logos.light || logoType === Logos.black
  return (
    <View style={styles.container}>
      <View style={[standardStyles.centered, styles.displayArea, { backgroundColor: background }]}>
        {useLight ? (
          <LogoLightBg height={35} allBlack={logoType === Logos.black} />
        ) : (
          <LogoDarkBg height={35} allWhite={logoType === Logos.black} />
        )}
      </View>
      <Text style={fonts.legal}>{caption}</Text>
      <Button kind={BTN.TERTIARY} text={btnText} style={styles.button} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 300,
    paddingHorizontal: GAP,
  },
  displayArea: {
    height: 172,
    width: '100%',
    marginVertical: 15,
  },
  button: {
    transform: [{ translateX: -20 }],
  },
})
