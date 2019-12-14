import * as React from 'react'
import { Text } from 'react-native'
import Page from 'src/brandkit/common/Page'
import { NameSpaces, withNamespaces } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'

const { brandImagery } = hashNav

// TODO in v 1.1
const KeyImageryWrapped = withNamespaces(NameSpaces.brand)(
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
