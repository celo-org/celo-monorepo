import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
import { WarningModal } from 'src/components/WarningModal'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { toggleFornoMode } from 'src/web3/actions'

interface StateProps {
  fornoEnabled: boolean
  gethStartedThisSession: boolean
}

interface DispatchProps {
  toggleFornoMode: typeof toggleFornoMode
}

type OwnProps = StackScreenProps<StackParamList, Screens.DataSaver>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

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
    const promptModalVisible = this.props.route.params.promptModalVisible
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
          body1={t('promptFornoModal.body')}
          continueTitle={t('promptFornoModal.switchToDataSaver')}
          cancelTitle={t('global:goBack')}
          onCancel={this.hidePromptModal}
          onContinue={this.onPressPromptModal}
        />
        <WarningModal
          isVisible={this.state.switchOffModalVisible}
          header={t('restartModalSwitchOff.header')}
          body1={t('restartModalSwitchOff.body')}
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
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.accountScreen10)(DataSaver))
