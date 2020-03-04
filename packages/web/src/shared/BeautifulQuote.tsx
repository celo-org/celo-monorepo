import * as React from 'react'
import { ImageBackground, ImageSourcePropType, StyleSheet, Text } from 'react-native'
import { useScreenSize } from 'src/layout/ScreenSize'
import { fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  imgSource: ImageSourcePropType
  quote: React.ReactNode
  citation: React.ReactNode
}

export default React.memo(function BeautifulQuote(props: Props) {
  const { isMobile } = useScreenSize()
  return (
    <ImageBackground
      source={props.imgSource}
      style={[styles.image, standardStyles.centered]}
      resizeMode={'cover'}
    >
      <Text
        style={[
          fonts.h1,
          isMobile ? styles.quoteMobile : styles.quote,
          textStyles.invert,
          textStyles.center,
        ]}
      >
        {props.quote}
      </Text>
      <Text
        style={[
          isMobile ? fonts.h1Mobile : fonts.h1,
          textStyles.invert,
          textStyles.center,
          standardStyles.blockMarginTopTablet,
        ]}
      >
        {props.citation}
      </Text>
    </ImageBackground>
  )
})

const styles = StyleSheet.create({
  image: { width: '100%', height: 510, padding: 15 },
  quote: {
    fontSize: 65,
    lineHeight: 72,
    fontStyle: 'italic',
  },
  quoteMobile: {
    fontSize: 42,
    lineHeight: 50,
    fontStyle: 'italic',
  },
})
