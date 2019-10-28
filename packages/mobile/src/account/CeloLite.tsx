import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
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

export class CeloLite extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:celoLite'),
  })

  render() {
    const { zeroSyncEnabled, t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={zeroSyncEnabled}
          onSwitchChange={this.props.toggleZeroSyncMode}
          details={t('celoLiteDetail')}
        >
          <Text style={fontStyles.body}>{t('enableCeloLite')}</Text>
        </SettingsSwitchItem>
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces(Namespaces.accountScreen10)(CeloLite))
