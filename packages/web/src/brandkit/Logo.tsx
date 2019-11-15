import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'
import { hashNav } from 'src/shared/menu-items'

import Page from 'src/brandkit/Page'

export default withNamespaces()(
  React.memo(function Logo() {
    return (
      <Page
        sections={[
          {
            id: hashNav.brandLogo.overview,
            children: (
              <View style={[styles.container, { height: 900, backgroundColor: colors.gold }]}>
                <Text>overview</Text>
              </View>
            ),
          },
          {
            id: hashNav.brandLogo.glyph,
            children: (
              <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
                <Text>glyph</Text>
              </View>
            ),
          },
          {
            id: hashNav.brandLogo.clearspace,
            children: (
              <View style={[styles.container, { height: 2000, backgroundColor: colors.purple }]}>
                <Text>clearspace</Text>
              </View>
            ),
          },
          {
            id: hashNav.brandLogo.size,
            children: (
              <View style={[styles.container, { height: 500, backgroundColor: colors.deepBlue }]}>
                <Text>size</Text>
              </View>
            ),
          },
          {
            id: hashNav.brandLogo.backgrounds,
            children: (
              <View style={[styles.container, { height: 500, backgroundColor: colors.deepBlue }]}>
                <Text>Backgrounds</Text>
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
