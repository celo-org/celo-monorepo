import React, { useCallback, useRef } from 'react'
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'

interface Props {
  title: string
  logs: string
  style?: ViewStyle
  onPress: () => void
}

export default function LogView({ title, logs, style, onPress }: Props) {
  const scrollViewRef = useRef<ScrollView>(null)
  const onContentSizeChange = useCallback(
    (/* contentWidth, contentHeight */) => {
      const scrollView = scrollViewRef.current
      if (scrollView) {
        scrollView.scrollToEnd({ animated: true })
      }
    },
    []
  )

  return (
    <View style={[styles.container, style]}>
      <Text>{title}</Text>
      <ScrollView ref={scrollViewRef} onContentSizeChange={onContentSizeChange}>
        <Text onPress={onPress} style={styles.logText}>
          {logs}
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logText: {
    fontSize: 10,
  },
})
