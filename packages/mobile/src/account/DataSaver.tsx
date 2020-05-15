import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { toggleFornoMode } from 'src/web3/actions'

interface StateProps {
  fornoEnabled: boolean
  gethStartedThisSession: boolean
}

interface DispatchProps {
  toggleFornoMode: typeof toggleFornoMode
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

const mapDispatchToProps = {
  toggleFornoMode,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    fornoEnabled: state.web3.fornoMode,
    gethStartedThisSession: state.geth.gethStartedThisSession,
  }
}

interface State {
  switchOffModalVisible: boolean
  promptModalVisible: boolean
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
    promptModalVisible: false,
  }

  componentDidMount() {
    const promptModalVisible = this.props.navigation.getParam('promptModalVisible')
    if (promptModalVisible) {
      this.setState({
        promptModalVisible,
      })
    }
  }

  showSwitchOffModal = () => {
    this.setState({ switchOffModalVisible: true })
  }

  hideSwitchOffModal = () => {
    this.setState({ switchOffModalVisible: false })
  }

  onPressToggleWithSwitchOffModal = () => {
    this.props.toggleFornoMode(false)
    this.hideSwitchOffModal()
  }

  onPressPromptModal = () => {
    this.props.toggleFornoMode(true)
    navigateBack()
  }

  hidePromptModal = () => {
    this.props.toggleFornoMode(false)
    navigateBack()
  }

  handleFornoToggle = (fornoMode: boolean) => {
    if (!fornoMode && this.props.gethStartedThisSession) {
      // Starting geth a second time this app session which will
      // require an app restart, so show restart modal
      this.showSwitchOffModal()
    } else {
      this.props.toggleFornoMode(fornoMode)
    }
  }

  render() {
    const { fornoEnabled, t } = this.props
    return (
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={fornoEnabled}
          onSwitchChange={this.handleFornoToggle}
          details={t('dataSaverDetail')}
        >
          <Text style={fontStyles.body}>{t('enableDataSaver')}</Text>
        </SettingsSwitchItem>
        <WarningModal
          isVisible={this.state.promptModalVisible}
          header={t('promptFornoModal.header')}
          body={t('promptFornoModal.body')}
          continueTitle={t('promptFornoModal.switchToDataSaver')}
          cancelTitle={t('global:goBack')}
          onCancel={this.hidePromptModal}
          onContinue={this.onPressPromptModal}
        />
        <WarningModal
          isVisible={this.state.switchOffModalVisible}
          header={t('restartModalSwitchOff.header')}
          body={t('restartModalSwitchOff.body')}
          continueTitle={t('restartModalSwitchOff.restart')}
          cancelTitle={t('global:cancel')}
          onCancel={this.hideSwitchOffModal}
          onContinue={this.onPressToggleWithSwitchOffModal}
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
