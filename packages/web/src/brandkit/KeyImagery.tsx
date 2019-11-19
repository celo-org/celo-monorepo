import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'
import { hashNav } from 'src/shared/menu-items'
import Page from 'src/brandkit/common/Page'
import ImageryFetcher from 'src/brandkit/common/ImageryFetcher'

const { brandImagery } = hashNav

const KeyImageryWrapped = withNamespaces()(
  React.memo(function KeyImagery() {
    return (
      <Page
        sections={[
          {
            id: brandImagery.overview,
            children: (
              <View style={[styles.container, { height: 900, backgroundColor: colors.gold }]}>
                <Text>overview</Text>
                <ImageryFetcher />
              </View>
            ),
          },
          {
            id: brandImagery.icons,
            children: (
              <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
                <Text>icons</Text>
              </View>
            ),
          },
          {
            id: brandImagery.illustrations,
            children: (
              <View style={[styles.container, { height: 2000, backgroundColor: colors.purple }]}>
                <Text>illustrations</Text>
              </View>
            ),
          },
          {
            id: brandImagery.graphics,
            children: (
              <View style={[styles.container, { height: 500, backgroundColor: colors.deepBlue }]}>
                <Text>graphics</Text>
              </View>
            ),
          },
        ]}
      />
    )
  })
)

export default KeyImageryWrapped

const styles = StyleSheet.create({
  container: { padding: 10 },
})
