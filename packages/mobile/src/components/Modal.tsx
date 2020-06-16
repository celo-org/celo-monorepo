import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import ReactNativeModal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'

interface Props {
  children: React.ReactNode
  isVisible: boolean
  style?: StyleProp<ViewStyle>
}

export default function Modal({ children, isVisible, style }: Props) {
  return (
    <ReactNativeModal isVisible={isVisible} backdropOpacity={0.1}>
      <SafeAreaView>
        <Card style={[styles.root, style]} rounded={true}>
          {children}
        </Card>
      </SafeAreaView>
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
