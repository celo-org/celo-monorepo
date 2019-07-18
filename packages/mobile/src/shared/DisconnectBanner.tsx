import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'

interface StateProps {
  appConnected: boolean
}

type Props = StateProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    appConnected: isAppConnected(state),
  }
}

class DisconnectBanner extends React.PureComponent<Props> {
  // This component is used in many screens but needs to remember when the app  been conneted.
  // This flag tracks that. Could move to redux but no need yet as it's the only consumer
  static hasAppConnected = false

  componentDidUpdate() {
    if (this.props.appConnected && !DisconnectBanner.hasAppConnected) {
      DisconnectBanner.hasAppConnected = true
    }
  }

  render() {
    const { t, appConnected } = this.props

    if (appConnected) {
      return null
    }

    return DisconnectBanner.hasAppConnected ? (
      <Text style={[styles.text, styles.textRed]}>
        <Text style={fontStyles.bold}>{t('poorConnection.0')}</Text> {t('poorConnection.1')}
      </Text>
    ) : (
      <Text style={[styles.text, styles.textGrey, fontStyles.bold]}>{t('connectingToCelo')}</Text>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    opacity: 0.5,
  },
  text: {
    ...fontStyles.bodySmall,
    textAlign: 'center',
  },
  textGrey: {
    color: colors.disconnectBannerGrey,
  },
  textRed: {
    color: colors.disconnectBannerRed,
  },
})

export default componentWithAnalytics(
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withNamespaces(Namespaces.global)(DisconnectBanner)
  )
)
