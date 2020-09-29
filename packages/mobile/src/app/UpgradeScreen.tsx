import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithCloseButton } from 'src/navigator/Headers.v2'
import { navigateToWalletStorePage } from 'src/utils/linking'

type Props = WithTranslation

class UpgradeScreen extends React.Component<Props> {
  static navigationOptions = {
    ...headerWithCloseButton,
  }

  render() {
    const { t } = this.props
    return (
      <FullscreenCTA
        title={t('appUpdateAvailable')}
        subtitle={t('appIsOutdated')}
        CTAText={t('update')}
        CTAHandler={navigateToWalletStorePage}
      />
    )
  }
}

export default withTranslation<Props>(Namespaces.global)(UpgradeScreen)
