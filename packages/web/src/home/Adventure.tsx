import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text } from 'react-native'
import { Cell, Spans } from 'src/layout/GridRow'
import { fonts, standardStyles } from 'src/styles'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
interface Props {
  source: ImageSourcePropType
  title: string
  text: string
  link?: {
    text: string
    href: string
  }
}
export function Adventure({ title, text, source, link }: Props) {
  return (
    <Cell span={Spans.third}>
      <Image source={source} style={styles.image} resizeMode="contain" />
      <Text style={[fonts.h6, standardStyles.elementalMargin]}>{title}</Text>
      <Text style={fonts.p}>{text}</Text>
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
