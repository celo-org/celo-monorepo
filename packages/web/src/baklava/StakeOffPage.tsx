import * as React from 'react'
import { View } from 'react-native'
import Cover from 'src/baklava/Cover'
import EndNote from 'src/baklava/EndNote'
import LeaderBoard from 'src/baklava/LeaderBoard'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import menuItems from 'src/shared/menu-items'

class StakeOffPage extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: ['common', 'baklava'] }
  }

  render() {
    return (
      <View>
        <OpenGraph
          path={menuItems.MAKE.link}
          title={'Make with Celo'}
          description={'Developer and validator resources to launch Celo in 2020'}
        />
        <Cover />
        <LeaderBoard />
        <EndNote />
      </View>
    )
  }
}

export default withNamespaces('baklava')(StakeOffPage)
