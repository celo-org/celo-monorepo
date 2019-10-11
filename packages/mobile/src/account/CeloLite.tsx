import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import { setZeroSyncMode } from 'src/web3/actions'

interface StateProps {
  zeroSyncEnabled: boolean
}

interface DispatchProps {
  setZeroSyncMode: typeof setZeroSyncMode
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    zeroSyncEnabled: state.web3.zeroSyncMode,
  }
}

export class CeloLite extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerTitle: i18n.t('accountScreen10:celoLite'),
  })

  render() {
    const { zeroSyncEnabled, t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={zeroSyncEnabled}
          onSwitchChange={this.props.setZeroSyncMode}
          details={t('celoLiteDetail')}
        >
          <Text style={fontStyles.body}>{t('enableCeloLite')}</Text>
        </SettingsSwitchItem>
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  accountHeader: {
    paddingTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 3,
    borderColor: '#EEEEEE',
    padding: 5,
    height: 54,
    margin: 20,
    width: variables.width - 40,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingLeft: 20,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  { setZeroSyncMode }
)(withNamespaces(Namespaces.accountScreen10)(CeloLite))
