import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Cover from 'src/dev/Cover'
import Engage from 'src/dev/Engage'
import Features from 'src/dev/Features'
import FullStack from 'src/dev/FullStack'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import menuItems from 'src/shared/menu-items'
const previewImage = require('src/dev/opengraph.jpg')

class BuildPage extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: ['common', 'dev'] }
  }

  render() {
    return (
      <View style={styles.container}>
        <OpenGraph
          image={previewImage}
          path={menuItems.BUILD.link}
          title={'Celo Validators'}
          description={'Learn how to run a node on Celo’s peer-to-peer network'}
        />
        <Cover />
        <FullStack />
        <Features />
        <Engage />
      </View>
    )
  }
}

export default withNamespaces(NameSpaces.dev)(BuildPage)

const styles = StyleSheet.create({
  container: { scrollPadding: 20 },
})
