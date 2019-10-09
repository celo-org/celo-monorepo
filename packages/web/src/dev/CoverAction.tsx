import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { H3 } from 'src/fonts/Fonts'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles, textStyles } from 'src/styles'
import { ViewStyle } from 'react-native'

interface Props {
  title: string
  text?: string
  graphic: ImageSourcePropType
  link?: { href: string; text: string }
  isMobile: boolean
  containerStyle?: ViewStyle
}

const GRAPHIC_SIZE = 80

export default function CoverAction({
  title,
  text,
  graphic,
  link,
  isMobile,
  containerStyle,
}: Props) {
  const style = containerStyle || (isMobile ? styles.containerMobile : styles.container)

  return (
    <View style={style}>
      <View style={isMobile && standardStyles.centered}>
        <FadeIn>
          {(load) => (
            <Image resizeMode="contain" onLoad={load} source={graphic} style={styles.graphic} />
          )}
        </FadeIn>
        <H3
          style={[textStyles.invert, standardStyles.elementalMargin, isMobile && textStyles.center]}
        >
          {title}
        </H3>
        <Text
          style={[
            fonts.p,
            textStyles.invert,
            standardStyles.elementalMarginBottom,
            isMobile && textStyles.center,
          ]}
        >
          {text}
        </Text>
      </View>
      {link && <Button kind={BTN.NAKED} href={link.href} text={link.text} size={SIZE.normal} />}
    </View>
  )
}

const styles = StyleSheet.create({
  graphic: {
    height: GRAPHIC_SIZE,
    width: GRAPHIC_SIZE,
  },
  container: {
    flex: 1,
    height: '100%',
    maxWidth: 270,
    minWidth: 160,
    marginTop: 30,
    marginHorizontal: 20,
    justifyContent: 'space-between',
  },
  containerMobile: {
    marginBottom: 50,
    marginHorizontal: 20,
    alignItems: 'center',
    flex: 1,
  },
})
