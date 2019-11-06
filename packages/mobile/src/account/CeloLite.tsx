import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { connect } from 'react-redux'
import CeloLiteModal from 'src/account/CeloLiteModal'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import { toggleZeroSyncMode } from 'src/web3/actions'

interface StateProps {
  zeroSyncEnabled: boolean
}

interface DispatchProps {
  toggleZeroSyncMode: typeof toggleZeroSyncMode
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapDispatchToProps = {
  toggleZeroSyncMode,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    zeroSyncEnabled: state.web3.zeroSyncMode,
  }
}

interface State {
  modalVisible: boolean
  buttonReset: boolean
}

export class CeloLite extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:celoLite'),
  })

  state = {
    modalVisible: false,
    buttonReset: false,
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false })
  }

  cancelModal = () => {
    this.setState({ modalVisible: false, buttonReset: true }, () => {
      this.setState({ buttonReset: false })
    })
  }

  sendSMS = () => {
    this.hideModal()
    // TODO restart app
  }

  handleZeroSyncToggle = (zeroSyncMode: boolean) => {
    this.props.toggleZeroSyncMode(zeroSyncMode)
    if (!zeroSyncMode) {
      // Starting geth, so show modal to restart app
      this.showModal()
    }
  }

  render() {
    const { zeroSyncEnabled, t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={zeroSyncEnabled}
          onSwitchChange={this.handleZeroSyncToggle}
          details={t('celoLiteDetail')}
        >
          <Text style={fontStyles.body}>{t('enableCeloLite')}</Text>
        </SettingsSwitchItem>
        <Modal
          isVisible={this.state.modalVisible}
          style={style.modal}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackButtonPress={this.cancelModal}
        >
          <View style={style.modalContainer}>
            <CeloLiteModal
              onSMS={this.sendSMS}
              onCancel={this.cancelModal}
              cancelText={t('cancel')}
              SMSText={t('inviteFlow11:inviteWithSMS')}
              whatsAppText={t('inviteFlow11:inviteWithWhatsapp')}
              margin={15}
            />
          </View>
        </Modal>
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modal: {
    flex: 1,
    margin: 0,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    flex: 1,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces(Namespaces.accountScreen10)(CeloLite))
