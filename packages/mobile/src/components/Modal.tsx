import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { StyleSheet, StyleProp, ViewStyle } from 'react-native'
import ReactNativeModal from 'react-native-modal'

interface Props {
  children: React.ReactNode
  isVisible: boolean
  style?: StyleProp<ViewStyle>
}

export default function Modal({ children, isVisible, style }: Props) {
  return (
    <ReactNativeModal isVisible={isVisible} backdropOpacity={0.1}>
      <Card style={[styles.root, style]} rounded={true}>
        {children}
      </Card>
    </ReactNativeModal>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.light,
    padding: 24,
    maxHeight: '100%',
  },
})
