import colors from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import RNModal from 'react-native-modal'

interface Props {
  style?: StyleProp<ViewStyle>
  isVisible: boolean
  useNativeDriver?: boolean
  hideModalContentWhileAnimating?: boolean
  children?: React.ReactNode
}

export default function Modal({
  style,
  useNativeDriver,
  hideModalContentWhileAnimating,
  isVisible,
  ...props
}: Props) {
  return (
    <RNModal
      isVisible={isVisible}
      useNativeDriver={useNativeDriver}
      hideModalContentWhileAnimating={hideModalContentWhileAnimating}
    >
      <View style={[style, styles.container]} {...props} />
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
