import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import ReactNativeModal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  children: React.ReactNode
  isVisible: boolean
  style?: StyleProp<ViewStyle>
}

export default function Modal({ children, isVisible, style }: Props) {
  return (
    // @ts-ignore statusBarTranslucent is supported since RN 0.62, but updated lib with the added prop hasn't been published yet
    <ReactNativeModal isVisible={isVisible} backdropOpacity={0.1} statusBarTranslucent={true}>
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
