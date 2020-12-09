import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useScreenSize } from 'src/layout/ScreenSize'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  title: string
  text: string
  leftWard?: boolean
  src: string
}

export default function FeatherPoint({ text, title, leftWard, src }: Props) {
  const { isDesktop } = useScreenSize()
  return (
    <View style={[styles.root, isDesktop && leftWard && styles.leftward]}>
      <Image style={styles.image} source={{ uri: src }} resizeMode="contain" />
      <View
        style={[
          standardStyles.row,
          styles.box,
          isDesktop && styles.float,
          isDesktop && leftWard && styles.leftwardInner,
        ]}
      >
        {isDesktop && <View style={styles.line} />}
        <View style={styles.content}>
          <Text style={[fonts.p, styles.title]}>{title}</Text>
          <Text style={[fonts.p, styles.text]}>{text}</Text>
        </View>
      </View>
    </View>
  )
}

const lineWidth = 175

const styles = StyleSheet.create({
  line: {
    backgroundColor: colors.white,
    height: 1,
    width: lineWidth,
    marginHorizontal: 30,
  },
  image: {
    height: 100,
    width: 35,
  },
  root: {
    width: 'fit-content',
    alignItems: 'center',
    marginVertical: 30,
    flexDirection: 'row',
  },
  content: {
    width: 205,
  },
  title: {
    fontWeight: '700',
    color: colors.white,
  },
  text: {
    color: colors.white,
  },
  box: {
    marginHorizontal: 30,
  },
  float: {
    position: 'absolute',
    alignItems: 'center',
  },
  leftward: { flexDirection: 'row' },
  leftwardInner: { flexDirection: 'row-reverse', transform: [{ translateX: -470 }] },
})
