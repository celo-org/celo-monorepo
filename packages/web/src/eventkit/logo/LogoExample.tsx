import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { brandStyles, GAP } from 'src/brandkit/common/constants'
import DownloadButton from 'src/brandkit/common/DownloadButton'
import { AssetTypes } from 'src/brandkit/tracking'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
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
  hasBorder: boolean
  href: string
}

export default React.memo(function LogoExample({
  href,
  caption,
  background,
  logoType,
  hasBorder,
}: Props) {
  const isLightbg = logoType === Logos.light || logoType === Logos.black
  return (
    <View style={styles.container}>
      <View
        style={[
          standardStyles.centered,
          styles.displayArea,
          hasBorder && brandStyles.fullBorder,
          { backgroundColor: background },
        ]}
      >
        {isLightbg ? (
          <LogoLightBg height={35} allBlack={logoType === Logos.black} />
        ) : (
          <LogoDarkBg height={35} allWhite={logoType === Logos.white} />
        )}
      </View>
      <Text style={fonts.legal}>{caption}</Text>
      <DownloadButton
        uri={href}
        trackingData={{ name: `${Logos[logoType]} Logo`, type: AssetTypes.logo }}
      />
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
    transform: [{ translateX: -30 }],
  },
})
