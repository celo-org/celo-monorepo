import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces, Namespace } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'

export default withNamespaces()(
  React.memo(function Color() {
    return <View style={styles.container}>{}</View>
  })
)

const styles = StyleSheet.create({
  container: { backgroundColor: colors.blueScreen, height: '100%' },
})
