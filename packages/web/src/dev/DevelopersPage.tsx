import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import DeveloperPhoneCover from 'src/dev/DeveloperPhoneCover'
import { Contribute, EngageAsDeveloper } from 'src/dev/Engage'
import Features from 'src/dev/Features'
import FullStack from 'src/dev/FullStack'
import Sandbox from 'src/dev/Sandbox'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import menuItems from 'src/shared/menu-items'
const previewImage = require('src/dev/opengraph.jpg')

class Developers extends React.PureComponent<I18nProps> {
  render() {
    return (
      <View style={styles.container}>
        <OpenGraph
          image={previewImage}
          path={menuItems.BUILD.link}
          title={'Build with Celo | Celo Developers'}
          description={
            "Documentation for Celo's open-source protocol. Celo is a proof-of-stake based blockchain with smart contracts that allows for an ecosystem of powerful applications built on top."
          }
        />
        <DeveloperPhoneCover />
        <Sandbox />
        <FullStack />
        <Features />
        <EngageAsDeveloper />
        <Contribute />
        <ConnectionFooter includeDividerLine={false} />
      </View>
    )
  }
}

export default withNamespaces(NameSpaces.dev)(Developers)

const styles = StyleSheet.create({
  container: { scrollPadding: 20 },
})
