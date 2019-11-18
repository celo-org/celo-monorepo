import * as React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { GAP } from 'src/brandkit/constants'

export enum Value {
  Good,
  Bad,
}

interface Props {
  is: Value
  children: React.ReactNode
}

export default function Judgement({ is, children }: Props) {
  return (
    <View style={styles.box}>
      <Image
        style={styles.image}
        source={
          is === Value.Bad
            ? require('src/brandkit/images/X.png')
            : require('src/brandkit/images/Check.png')
        }
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: GAP,
  },
  image: {
    height: 24,
    width: 24,
  },
})
