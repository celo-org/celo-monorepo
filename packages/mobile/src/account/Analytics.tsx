import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setAnalyticsEnabled } from 'src/app/actions'
import CancelButton from 'src/components/CancelButton'
import i18n, { Namespaces } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  analyticsEnabled: boolean
}

interface DispatchProps {
  setAnalyticsEnabled: typeof setAnalyticsEnabled
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    analyticsEnabled: state.app.analyticsEnabled,
  }
}

export class Analytics extends React.PureComponent<Props> {
  static navigationOptions = {
    headerLeft: <CancelButton />,
    title: i18n.t('accountScreen10:analytics'),
    headerRight: <View />,
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  }

  render() {
    const { analyticsEnabled, t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <SettingsSwitchItem
          switchValue={analyticsEnabled}
          onSwitchChange={this.props.setAnalyticsEnabled}
          details={t('shareAnalytics_detail')}
        >
          <Text style={fontStyles.body}>{t('shareAnalytics')}</Text>
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
  { setAnalyticsEnabled }
)(withNamespaces(Namespaces.accountScreen10)(Analytics))
