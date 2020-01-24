import * as React from 'react'
import { ImageBackground, ImageRequireSource, StyleSheet, View } from 'react-native'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import LogoLightBg from 'src/logos/LogoLightBg'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, standardStyles } from 'src/styles'

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
      <AspectRatio ratio={1}>
        <ImageBackground
          source={image}
          style={[standardStyles.centered, hasBorder && styles.border, styles.box]}
        >
          {logo}
        </ImageBackground>
      </AspectRatio>
    )
  }

  return (
    <AspectRatio ratio={1}>
      <View
        style={[
          standardStyles.centered,
          styles.box,
          hasBorder && styles.border,
          { backgroundColor },
        ]}
      >
        {logo}
      </View>
    </AspectRatio>
  )
})

const styles = StyleSheet.create({
  box: {
    height: '100%',
    width: '100%',
  },
  border: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
})
