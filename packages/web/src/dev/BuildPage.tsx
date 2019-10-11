import * as React from 'react'
import { View } from 'react-native'
import Cover from 'src/dev/Cover'
import DeveloperUpdates from 'src/dev/DeveloperUpdates'
import Features from 'src/dev/Features'

import FullStack from 'src/dev/FullStack'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import menuItems from 'src/shared/menu-items'

class BuildPage extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: ['common', 'dev'] }
  }

  render() {
    return (
      <View
        style={{
          // @ts-ignore
          scrollPadding: 20,
        }}
      >
        <OpenGraph
          path={menuItems.BUILD.link}
          title={'Build with Celo | Celo Developers'}
          description={
            "Documentation for Celo's open-source protocol. Celo is a proof-of-stake based blockchain with smart contracts that allows for an ecosystem of powerful applications built on top."
          }
        />
        <Cover />
        <FullStack />
        <Features />
        <DeveloperUpdates />
      </View>
    )
  }
}

export default withNamespaces('dev')(BuildPage)
