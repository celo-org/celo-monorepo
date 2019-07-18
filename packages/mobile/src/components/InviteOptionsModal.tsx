import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import SmsIcon from 'src/icons/SmsIcon'
import WhatsAppLogo from 'src/icons/WhatsAppLogo'

interface Props {
  onCancel: () => void
  onWhatsApp: () => void
  onSMS: () => void
  cancelText: string
  whatsAppText: string
  SMSText: string
  margin?: number
}

interface State {
  inviteConfirmed: boolean
}

class InviteOptionsModal extends React.PureComponent<Props, State> {
  static defaultProps = {
    margin: 0,
  }

  state = {
    inviteConfirmed: false,
  }

  render() {
    const { onCancel, onWhatsApp, onSMS, cancelText, whatsAppText, SMSText, margin } = this.props

    return (
      <View style={[componentStyles.bottomContainer, style.modal]}>
        <View style={{ height: margin }} />
        <Button
          onPress={onSMS}
          text={SMSText}
          accessibilityLabel={SMSText}
          standard={false}
          type={BtnTypes.TERTIARY}
          disabled={this.state.inviteConfirmed}
        >
          <SmsIcon />
        </Button>
        <View style={{ height: margin }} />
        <Button
          onPress={onWhatsApp}
          text={whatsAppText}
          accessibilityLabel={whatsAppText}
          standard={false}
          type={BtnTypes.TERTIARY}
          disabled={this.state.inviteConfirmed}
        >
          <WhatsAppLogo />
        </Button>
        <View style={{ height: margin }} />
        <Button
          onPress={onCancel}
          text={cancelText}
          accessibilityLabel={cancelText}
          standard={false}
          type={BtnTypes.SECONDARY}
          disabled={this.state.inviteConfirmed}
        />
        <View style={{ height: margin }} />
        {this.state.inviteConfirmed && (
          <View style={style.loadingIcon}>
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  containerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: colors.white,
  },
})

export default InviteOptionsModal
