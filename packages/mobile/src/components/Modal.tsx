import colors from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import RNModal from 'react-native-modal'

interface Props {
  isVisible: boolean
  children?: React.ReactNode
}

export default function Modal({ isVisible, ...props }: Props) {
  return (
    <RNModal isVisible={isVisible}>
      <View style={styles.container} {...props} />
    </RNModal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    ...elevationShadowStyle(12),
    padding: 24,
    margin: 8,
    borderRadius: 8,
  },
})
