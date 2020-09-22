import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  text: string
}

function SectionHead({ text }: Props) {
  return (
    <View style={style.container}>
      <Text style={style.text}>{text}</Text>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: {
    ...fontStyles.h2,
    color: colors.dark,
  },
})

export default SectionHead
