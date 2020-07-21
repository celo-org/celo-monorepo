import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
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
  tintColor?: string
}

interface State {
  isOpen: boolean
}

// /* tslint:disable:max-classes-per-file */
class FeeIcon extends React.Component<Props, State> {
  static defaultProps = {
    tintColor: colors.lightGray,
  }

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
          <InfoIcon size={12} tintColor={this.props.tintColor} />
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

export const ExchangeFeeIcon = ({ tintColor }: Pick<Props, 'tintColor'>) => {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  return (
    <FeeIcon
      title={t('exchangeFee')}
      description={t('feeExchangeEducation')}
      dismissText={t('global:dismiss')}
      tintColor={tintColor}
    />
  )
}

export const SecurityFeeIcon = ({ tintColor }: Pick<Props, 'tintColor'>) => {
  const { t } = useTranslation(Namespaces.sendFlow7)
  return (
    <FeeIcon
      title={t('securityFee')}
      description={t('feeEducation')}
      dismissText={t('global:dismiss')}
      tintColor={tintColor}
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
