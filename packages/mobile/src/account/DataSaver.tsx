import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import { toggleZeroSyncMode } from 'src/web3/actions'

interface StateProps {
  zeroSyncEnabled: boolean
  gethStartedThisSession: boolean
}

interface DispatchProps {
  toggleZeroSyncMode: typeof toggleZeroSyncMode
}

type Props = StateProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  toggleZeroSyncMode,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    zeroSyncEnabled: state.web3.zeroSyncMode,
    gethStartedThisSession: state.web3.gethStartedThisSession,
  }
}

interface State {
  modalVisible: boolean
}

export class DataSaver extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:dataSaver'),
  })

  state = {
    modalVisible: false,
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false })
  }

  onPressToggleWithRestartModal = () => {
    this.props.toggleZeroSyncMode(false)
    this.hideModal()
  }

  handleZeroSyncToggle = (zeroSyncMode: boolean) => {
    if (!zeroSyncMode && this.props.gethStartedThisSession) {
      // Starting geth a second time this app session which will
      // require an app restart, so show restart modal
      this.showModal()
    } else {
      this.props.toggleZeroSyncMode(zeroSyncMode)
    }
  }

  render() {
    const { zeroSyncEnabled, t } = this.props
    return (
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={zeroSyncEnabled}
          onSwitchChange={this.handleZeroSyncToggle}
          details={t('dataSaverDetail')}
        >
          <Text style={fontStyles.body}>{t('enableDataSaver')}</Text>
        </SettingsSwitchItem>
        <Modal isVisible={this.state.modalVisible}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{t('restartModal.header')}</Text>
            <Text style={fontStyles.body}>{t('restartModal.body')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.hideModal} style={styles.modalCancelText}>
                {t('global:cancel')}
              </TextButton>
              <TextButton onPress={this.onPressToggleWithRestartModal} style={styles.modalSkipText}>
                {t('restartModal.restart')}
              </TextButton>
            </View>
          </View>
        </Modal>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
    paddingLeft: 20,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.accountScreen10)(DataSaver))
