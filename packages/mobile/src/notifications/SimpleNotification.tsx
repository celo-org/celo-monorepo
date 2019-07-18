import BaseNotification, { CTA } from '@celo/react-components/components/BaseNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

interface OwnProps {
  text: string
  title: string
  image: ImageSourcePropType
  ctaList: CTA[]
}

type Props = OwnProps

export function SimpleNotification(props: Props) {
  return (
    <BaseNotification
      title={props.title}
      icon={<Image source={props.image} style={styles.image} resizeMode="contain" />}
      ctas={props.ctaList}
      roundedBorders={true}
    >
      <View style={styles.body}>
        <Text style={fontStyles.subSmall}>{props.text}</Text>
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
