import Touchable from '@celo/react-components/components/Touchable'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'

interface Props {
  title: string | React.ReactElement
  description: string | React.ReactElement
  dismissText: string
}

interface State {
  isOpen: boolean
}

// /* tslint:disable:max-classes-per-file */
class FeeIcon extends React.Component<Props, State> {
  state = {
    isOpen: false,
  }

  onDismiss = () => {
    this.setState({ isOpen: false })
  }

  onIconPress = () => {
    this.setState({ isOpen: true })
  }

  render() {
    const { isOpen } = this.state
    const { title, description, dismissText } = this.props
    return (
      <>
        <Touchable
          onPress={this.onIconPress}
          style={styles.area}
          borderless={true}
          hitSlop={iconHitslop}
        >
          <InfoIcon size={12} />
        </Touchable>
        <Dialog
          title={title}
          isVisible={isOpen}
          actionText={dismissText}
          actionPress={this.onDismiss}
        >
          {description}
        </Dialog>
      </>
    )
  }
}

export const ExchangeFeeIcon = () => {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  return (
    <FeeIcon
      title={t('exchangeFee')}
      description={t('feeExchangeEducation')}
      dismissText={t('global:dismiss')}
    />
  )
}

export const SecurityFeeIcon = () => {
  const { t } = useTranslation(Namespaces.sendFlow7)
  return (
    <FeeIcon
      title={t('securityFee')}
      description={t('feeEducation')}
      dismissText={t('global:dismiss')}
    />
  )
}

export const EncryptionFeeIcon = () => {
  const { t } = useTranslation(Namespaces.sendFlow7)
  return (
    <FeeIcon
      title={t('encryption.feeLabel')}
      description={t('encryption.feeModalBody')}
      dismissText={t('global:dismiss')}
    />
  )
}

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})
