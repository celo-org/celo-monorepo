import React from 'react'
import { Platform, StyleSheet } from 'react-native'
import { WebView as RNWebView, WebViewProps } from 'react-native-webview'

// This is to prevent a crash on specific Android versions,
// see https://github.com/react-native-webview/react-native-webview/issues/429
const SHOULD_USE_OPACITY_HACK = Platform.OS === 'android' && Platform.Version >= 28

export default function WebView({ style, ...passThroughProps }: WebViewProps) {
  return (
    <RNWebView
      {...passThroughProps}
      style={SHOULD_USE_OPACITY_HACK ? [style, styles.opacityHack] : style}
    />
  )
}

const styles = StyleSheet.create({
  opacityHack: {
    opacity: 0.99,
  },
})
