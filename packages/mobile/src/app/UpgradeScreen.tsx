import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Namespaces, withTranslation } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateToWalletStorePage } from 'src/utils/linking'

type Props = WithTranslation

class UpgradeScreen extends React.Component<Props> {
  static navigationOptions = {
    ...emptyHeader,
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
