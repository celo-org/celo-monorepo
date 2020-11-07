import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { fonts, standardStyles, textStyles } from 'src/styles'
interface Props {
  title: string
  text?: string
  graphic: ImageSourcePropType
}

type func = () => void

const GRAPHIC_SIZE = 80

const FeatureComponent = React.memo(function Feature({ title, graphic, text }: Props) {
  return (
    <View style={[standardStyles.elementalMargin, styles.container]}>
      <FadeIn placeholder={<View style={styles.graphic} />}>
        {(load: func) => (
          <Image resizeMode="contain" onLoad={load} source={graphic} style={styles.graphic} />
        )}
      </FadeIn>
      <View style={styles.textArea}>
        <Text style={[fonts.h6, textStyles.invert, styles.title]}>{title}</Text>
        <Text style={[fonts.p, textStyles.readingOnDark]}>{text}</Text>
      </View>
    </View>
  )
})
export default FeatureComponent

const styles = StyleSheet.create({
  graphic: {
    height: GRAPHIC_SIZE,
    width: GRAPHIC_SIZE * 1.4,
  },
  title: {
    marginVertical: 10,
  },
  container: {
    marginRight: 20,
    flexDirection: 'row',
    flex: 0,
  },
  textArea: { width: '100%', flex: 1 },
})
