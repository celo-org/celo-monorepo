import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigateToWalletPlayStorePage } from 'src/utils/linking'

type Props = WithTranslation

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

export default withTranslation<Props>(Namespaces.global)(UpgradeScreen)
