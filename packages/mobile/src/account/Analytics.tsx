import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
import { setAnalyticsEnabled } from 'src/app/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  analyticsEnabled: boolean
}

interface DispatchProps {
  setAnalyticsEnabled: typeof setAnalyticsEnabled
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => {
  return {
    analyticsEnabled: state.app.analyticsEnabled,
  }
}

export class Analytics extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:analytics'),
  })

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
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  setAnalyticsEnabled,
})(withTranslation<Props>(Namespaces.accountScreen10)(Analytics))
