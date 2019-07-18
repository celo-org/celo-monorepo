import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { navigateToWalletPlayStorePage } from 'src/utils/linking'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

class UpgradeScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  render() {
    const { t } = this.props
    return (
      <FullscreenCTA
        title={t('appHasToBeUpdated')}
        subtitle={t('thisVersionIsInsecure')}
        CTAText={t('update')}
        CTAHandler={navigateToWalletPlayStorePage}
      />
    )
  }
}

export default withNamespaces('global')(UpgradeScreen)
