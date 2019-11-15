import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'
import { hashNav } from 'src/shared/menu-items'

const { brandColor } = hashNav

import Page from 'src/brandkit/Page'

export default withNamespaces()(
  React.memo(function Color() {
    return (
      <Page
        sections={[
          {
            id: brandColor.overview,
            children: (
              <View style={[styles.container, { height: 900, backgroundColor: colors.gold }]}>
                <Text>overview</Text>
              </View>
            ),
          },
          {
            id: brandColor.system,
            children: (
              <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
                <Text>{brandColor.system}</Text>
              </View>
            ),
          },
          {
            id: brandColor.guideline,
            children: (
              <View style={[styles.container, { height: 2000, backgroundColor: colors.purple }]}>
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
