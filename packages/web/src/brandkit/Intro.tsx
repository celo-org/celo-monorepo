import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'

import Page from 'src/brandkit/Page'

export default withNamespaces()(
  React.memo(function Intro() {
    return (
      <Page
        sections={[
          {
            id: 'overview',
            children: (
              <View style={[styles.container, { height: 900, backgroundColor: colors.gold }]}>
                <Text>overview</Text>
              </View>
            ),
          },
          {
            id: 'glyph',
            children: (
              <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
                <Text>glyph</Text>
              </View>
            ),
          },
          {
            id: 'wordmark',
            children: (
              <View style={[styles.container, { height: 2000, backgroundColor: colors.purple }]}>
                <Text>wordmark</Text>
              </View>
            ),
          },
          {
            id: 'guidelines',
            children: (
              <View style={[styles.container, { height: 500, backgroundColor: colors.deepBlue }]}>
                <Text>guidelines</Text>
              </View>
            ),
          },
        ]}
      />
    )
  })
)

const styles = StyleSheet.create({
  container: { padding: 10 },
})
