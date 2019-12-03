import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Page from 'src/brandkit/common/Page'
import { hashNav } from 'src/shared/menu-items'

const { brandImagery } = hashNav

// TODO in v 1.1
const KeyImageryWrapped = withNamespaces()(
  React.memo(function KeyImagery() {
    return (
      <Page
        sections={[
          {
            id: brandImagery.overview,
            children: <Text>overview</Text>,
          },
          {
            id: brandImagery.illustrations,
            children: <Text>illustrations</Text>,
          },
          {
            id: brandImagery.graphics,
            children: <Text>graphics</Text>,
          },
        ]}
      />
    )
  })
)

export default KeyImageryWrapped

// const styles = StyleSheet.create({
//   container: { padding: 10 },
// })
