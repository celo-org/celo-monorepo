import BaseNotification, { CTA } from '@celo/react-components/components/BaseNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

interface OwnProps {
  text: string
  title: string
  ctaList: CTA[]
  image: ImageSourcePropType | React.ReactNode
}

type Props = OwnProps

export function SimpleNotification(props: Props) {
  const { text, title, ctaList, image } = props

  const icon = React.isValidElement(image) ? (
    image
  ) : (
    // @ts-ignore isValidElement check above ensures image is an image source type
    <Image source={image} style={styles.image} resizeMode="contain" />
  )

  return (
    <BaseNotification title={title} icon={icon} ctas={ctaList}>
      <View style={styles.body}>
        <Text style={fontStyles.subSmall}>{text}</Text>
      </View>
    </BaseNotification>
  )
}

const styles = StyleSheet.create({
  body: {
    marginTop: 5,
  },
  image: {
    width: 30,
    height: 30,
  },
})

export default SimpleNotification
