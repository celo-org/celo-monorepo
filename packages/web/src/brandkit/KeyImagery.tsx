import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Fetch from 'src/brandkit/common/Fetch'
import Page from 'src/brandkit/common/Page'
import { hashNav } from 'src/shared/menu-items'
import { colors } from 'src/styles'

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
              </View>
            ),
          },
          {
            id: brandImagery.illustrations,
            children: (
              <View style={[styles.container, { height: 2000, backgroundColor: colors.purple }]}>
                <Text>illustrations</Text>
                {/* <Fetch /> */}
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
