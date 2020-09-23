import * as React from 'react'
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, View } from 'react-native'
import { Cell, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles } from 'src/styles'
interface Props {
  source: ImageSourcePropType
  title: string
  text: string
  link?: {
    text: string
    href: string
  }
  imageStyle?: ImageStyle
}
export function Adventure({ title, text, source, link, imageStyle }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <Cell
      span={Spans.third}
      style={[styles.root, isMobile && standardStyles.elementalMarginBottom]}
    >
      <View>
        <Image source={source} style={[styles.image, imageStyle]} resizeMode="contain" />
        <Text style={[fonts.h6, standardStyles.elementalMargin]}>{title}</Text>
        <Text style={fonts.p}>{text}</Text>
      </View>
      {link && (
        <Button
          style={standardStyles.elementalMarginTop}
          href={link.href}
          text={link.text}
          kind={BTN.NAKED}
          size={SIZE.normal}
        />
      )}
    </Cell>
  )
}
const styles = StyleSheet.create({
  root: {
    justifyContent: 'space-between',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  link: {
    padding: 10,
  },
  image: { width: 100, height: 100 },
})
