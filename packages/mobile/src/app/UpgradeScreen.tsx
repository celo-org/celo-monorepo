import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigateToWalletPlayStorePage } from 'src/utils/linking'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithTranslation

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

export default withTranslation(Namespaces.global)(UpgradeScreen)
