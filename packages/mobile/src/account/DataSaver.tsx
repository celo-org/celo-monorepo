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
  switchOffModalVisible: boolean
  switchOnModalVisible: boolean
}

interface ModalProps {
  isVisible: boolean
  header: string
  body: string
  continueTitle: string
  cancelTitle: string
  onCancel: () => void
  onContinue: () => void
}

function WarningModal({
  isVisible,
  header,
  body,
  continueTitle,
  cancelTitle,
  onCancel,
  onContinue,
}: ModalProps) {
  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>{header}</Text>
        <Text style={fontStyles.body}>{body}</Text>
        <View style={styles.modalButtonsContainer}>
          <TextButton onPress={onCancel} style={styles.modalCancelText}>
            {cancelTitle}
          </TextButton>
          <TextButton onPress={onContinue} style={styles.modalSkipText}>
            {continueTitle}
          </TextButton>
        </View>
      </View>
    </Modal>
  )
}

export class DataSaver extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:dataSaver'),
  })

  state = {
    switchOffModalVisible: false,
    switchOnModalVisible: false,
  }

  showSwitchOffModal = () => {
    this.setState({ switchOffModalVisible: true })
  }

  hideSwitchOffModal = () => {
    this.setState({ switchOffModalVisible: false })
  }

  onPressToggleWithSwitchOffModal = () => {
    this.props.toggleZeroSyncMode(false)
    this.hideSwitchOffModal()
  }

  showSwitchOnModal = () => {
    this.setState({ switchOnModalVisible: true })
  }

  hideSwitchOnModal = () => {
    this.setState({ switchOnModalVisible: false })
  }

  onPressToggleWithSwitchOnModal = () => {
    this.props.toggleZeroSyncMode(true)
    this.hideSwitchOnModal()
  }

  handleZeroSyncToggle = (zeroSyncMode: boolean) => {
    if (!zeroSyncMode && this.props.gethStartedThisSession) {
      // Starting geth a second time this app session which will
      // require an app restart, so show restart modal
      this.showSwitchOffModal()
    } else {
      // If move to zeroSync was not successful we will need
      // to rollback starting geth a second time
      this.showSwitchOnModal()
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
        <WarningModal
          isVisible={this.state.switchOffModalVisible}
          header={t('restartModalSwitchOff.header')}
          body={t('restartModalSwitchOff.body')}
          continueTitle={t('restartModalSwitchOff.restart')}
          cancelTitle={t('global:cancel')}
          onCancel={this.hideSwitchOffModal}
          onContinue={this.onPressToggleWithSwitchOffModal}
        />
        <WarningModal
          isVisible={this.state.switchOnModalVisible}
          header={t('restartModalSwitchOn.header')}
          body={t('restartModalSwitchOn.body')}
          continueTitle={t('restartModalSwitchOn.understand')}
          cancelTitle={t('global:cancel')}
          onCancel={this.hideSwitchOnModal}
          onContinue={this.onPressToggleWithSwitchOnModal}
        />
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
