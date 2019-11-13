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
import TextButton from '@celo/react-components/components/TextButton'
import { componentStyles } from '@celo/react-components/styles/styles'

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
}

export class CeloLite extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:celoLite'),
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

  onPressRestartModal = () => {
    this.props.toggleZeroSyncMode(false)
    this.hideModal()
    // TODO restart app
  }

  handleZeroSyncToggle = (zeroSyncMode: boolean) => {
    if (zeroSyncMode) {
      this.props.toggleZeroSyncMode(true)
    } else {
      // Starting geth, so show modal to restart app
      // zeroSyncMode will be updated if selected in modal
      this.showModal()
    }
  }

  render() {
    const { zeroSyncEnabled, t } = this.props
    return (
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={zeroSyncEnabled}
          onSwitchChange={this.handleZeroSyncToggle}
          details={t('celoLiteDetail')}
        >
          <Text style={fontStyles.body}>{t('enableCeloLite')}</Text>
        </SettingsSwitchItem>
        <Modal isVisible={this.state.modalVisible}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{t('skipModal.header')}</Text>
            <Text style={fontStyles.body}>{t('skipModal.body1')}</Text>
            <Text style={[fontStyles.body, componentStyles.marginTop10]}>
              {t('skipModal.body2')}
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.hideModal} style={styles.modalCancelText}>
                {t('global:cancel')}
              </TextButton>
              <TextButton onPress={this.onPressRestartModal} style={styles.modalSkipText}>
                {t('global:skip')}
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
)(withNamespaces(Namespaces.accountScreen10)(CeloLite))
