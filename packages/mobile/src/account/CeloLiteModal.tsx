import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  onCancel: () => void
  onSMS: () => void
  cancelText: string
  whatsAppText: string
  SMSText: string
  margin?: number
}

interface State {
  inviteConfirmed: boolean
}

class CeloLiteModal extends React.PureComponent<Props, State> {
  static defaultProps = {
    margin: 0,
  }

  state = {
    inviteConfirmed: false,
  }

  render() {
    const { onCancel, onSMS, cancelText, SMSText, margin } = this.props

    return (
      <View style={[componentStyles.bottomContainer, style.modal]}>
        <View
          style={{
            height: margin,
            flex: 1,
            backgroundColor: colors.background,
          }}
        />
        <Text style={fontStyles.body}>To disable Celo Lite, please restart the app.</Text>

        <Button
          onPress={onSMS}
          text={SMSText}
          accessibilityLabel={SMSText}
          standard={true}
          type={BtnTypes.TERTIARY}
        />
        <Button
          onPress={onCancel}
          text={cancelText}
          accessibilityLabel={SMSText}
          standard={true}
          type={BtnTypes.SECONDARY}
          style={style.modifyButton}
        />
        <View style={{ height: margin }} />
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
  modifyButton: {
    marginBottom: 10,
  },
})

export default CeloLiteModal
