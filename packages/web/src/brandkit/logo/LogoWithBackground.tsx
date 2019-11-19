import LogoLightBg from 'src/logos/LogoLightBg'
import * as React from 'react'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import { ImageBackground, StyleSheet, View, ImageRequireSource } from 'react-native'
import { standardStyles, colors } from 'src/styles'

interface Props {
  image?: ImageRequireSource
  backgroundColor?: string
  type: 'light' | 'dark' | 'black' | 'white'
  hasBorder?: boolean
}

export default React.memo(function LogoWithBackground({
  type,
  backgroundColor,
  image,
  hasBorder,
}: Props) {
  let logo

  if (type === 'light') {
    logo = <LogoLightBg height={35} />
  } else if (type === 'black') {
    logo = <LogoLightBg height={35} allBlack={true} />
  } else {
    logo = <LogoDarkBg height={35} allWhite={type === 'white'} />
  }

  if (image) {
    return (
      <ImageBackground
        source={image}
        style={[standardStyles.centered, hasBorder && styles.border, styles.box]}
      >
        {logo}
      </ImageBackground>
    )
  }

  return (
    <View
      style={[standardStyles.centered, styles.box, hasBorder && styles.border, { backgroundColor }]}
    >
      {logo}
    </View>
  )
})

const styles = StyleSheet.create({
  box: {
    flexBasis: 230,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
})
