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
        ]}
      />
    )
  })
)

const styles = StyleSheet.create({
  container: { padding: 10 },
})
