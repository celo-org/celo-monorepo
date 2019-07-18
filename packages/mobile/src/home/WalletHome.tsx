import SectionHead from '@celo/react-components/components/SectionHead'
import Touchable from '@celo/react-components/components/Touchable'
import SettingsIcon from '@celo/react-components/icons/Settings'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles, TOP_BAR_HEIGHT } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import {
  Animated,
  RefreshControl,
  RefreshControlProps,
  SectionList,
  SectionListData,
  StyleSheet,
  View,
} from 'react-native'
import { BoxShadow } from 'react-native-shadow'
import { connect } from 'react-redux'
import AccountInfo from 'src/account/AccountInfo'
import { hideAlert, showMessage } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exitBackupFlow } from 'src/app/actions'
import AccountOverview from 'src/components/AccountOverview'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import NotificationBox from 'src/home/NotificationBox'
import { callToActNotificationSelector, getActiveNotificationCount } from 'src/home/selectors'
import TransactionsList from 'src/home/TransactionsList'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { initializeSentryUserContext } from 'src/sentry/Sentry'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { resetStandbyTransactions } from 'src/transactions/actions'
import { currentAccountSelector } from 'src/web3/selectors'

const SCREEN_WIDTH = variables.width

interface StateProps {
  loading: boolean
  address?: string | null
  activeNotificationCount: number
  callToActNotification: boolean
}

interface DispatchProps {
  refreshAllBalances: typeof refreshAllBalances
  resetStandbyTransactions: typeof resetStandbyTransactions
  initializeSentryUserContext: typeof initializeSentryUserContext
  exitBackupFlow: typeof exitBackupFlow
  setLoading: typeof setLoading
  showMessage: typeof showMessage
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  loading: state.home.loading,
  address: currentAccountSelector(state),
  activeNotificationCount: getActiveNotificationCount(state),
  callToActNotification: callToActNotificationSelector(state),
})

const Header = () => {
  return (
    <>
      <DisconnectBanner />
      <AccountInfo />
      <AccountOverview testID="AccountOverviewInHome" />
    </>
  )
}

const settings = () => {
  navigate(Screens.Account)
}

const HeaderIcon = () => (
  <Touchable
    borderless={true}
    hitSlop={{ left: 15, bottom: 15, top: 15, right: 15 }}
    style={styles.settingsIcon}
    onPress={settings}
  >
    <SettingsIcon color={colors.celoGreen} />
  </Touchable>
)

const AnimatedSectionList: SectionList<any> = Animated.createAnimatedComponent(SectionList)

const HEADER_FADE_HEIGHT = 100
const SHADOW_SCROLL_HEIGHT = 226
const SHADOW_STYLE = {
  width: SCREEN_WIDTH,
  height: TOP_BAR_HEIGHT,
  color: '#2e3338',
  radius: 1,
  opacity: 0.1,
  x: 0,
  y: 1,
}
export class WalletHome extends React.PureComponent<Props> {
  animatedValue: Animated.Value
  headerOpacity: Animated.AnimatedInterpolation
  shadowOpacity: Animated.AnimatedInterpolation
  onScroll: () => void

  constructor(props: Props) {
    super(props)

    this.animatedValue = new Animated.Value(0)
    this.headerOpacity = this.animatedValue.interpolate({
      inputRange: [0, HEADER_FADE_HEIGHT],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    })
    this.shadowOpacity = this.animatedValue.interpolate({
      inputRange: [0, HEADER_FADE_HEIGHT, SHADOW_SCROLL_HEIGHT, SHADOW_SCROLL_HEIGHT + 1],
      outputRange: [0, 1, 1, 0],
      extrapolate: 'clamp',
    })
    this.onScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { y: this.animatedValue } } }],
      {
        useNativeDriver: true,
      }
    )
  }

  onRefresh = async () => {
    this.props.refreshAllBalances()
  }

  componentDidMount() {
    this.props.resetStandbyTransactions()
    this.props.initializeSentryUserContext()
    this.showTestnetBanner()
  }

  renderSection = ({ section: { title, bubbleText } }: { section: SectionListData<any> }) => (
    <SectionHead text={title} bubbleText={bubbleText} />
  )

  keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  showTestnetBanner = () => {
    const { t } = this.props
    this.props.showMessage(t('testnetAlert.1'), null, t('dismiss'), t('testnetAlert.0'))
  }

  render() {
    const { t, activeNotificationCount, callToActNotification } = this.props

    const refresh: React.ReactElement<RefreshControlProps> = (
      <RefreshControl
        refreshing={this.props.loading}
        onRefresh={this.onRefresh}
        colors={[colors.celoGreen]}
      />
    ) as React.ReactElement<RefreshControlProps>

    const sections = []

    if (activeNotificationCount > 0 || callToActNotification) {
      sections.push({
        title: t('notifications'),
        data: [{}],
        renderItem: () => <NotificationBox key={'NotificationBox'} />,
        bubbleText: activeNotificationCount ? activeNotificationCount.toString() : null,
      })
    }

    sections.push({
      title: t('activity'),
      data: [{}],
      renderItem: () => <TransactionsList key={'TransactionList'} />,
    })

    return (
      <View style={styles.container}>
        {/* Why this mess? Android only has shadows from elevation, and we have to fade in under
            If we use elevation, it appears on top of the title. The box shadow enables to fade
            in a shadow from underneath */}
        <Animated.View style={[styles.shadowContainer, { opacity: this.shadowOpacity }]}>
          <BoxShadow setting={SHADOW_STYLE}>
            <View style={styles.shadowPlaceholder} />
          </BoxShadow>
        </Animated.View>
        <View style={[componentStyles.topBar, styles.head]}>
          <Animated.Text style={[fontStyles.headerTitle, { opacity: this.headerOpacity }]}>
            {t('wallet')}
          </Animated.Text>
          <HeaderIcon />
        </View>
        <AnimatedSectionList
          onScroll={this.onScroll}
          refreshControl={refresh}
          onRefresh={this.onRefresh}
          refreshing={this.props.loading}
          style={styles.container}
          sections={sections}
          stickySectionHeadersEnabled={true}
          renderSectionHeader={this.renderSection}
          ListHeaderComponent={Header}
          keyExtractor={this.keyExtractor}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  containerFeed: {
    paddingBottom: 40,
  },
  settingsIcon: {
    justifyContent: 'flex-end',
    margin: 5,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  head: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  shadowContainer: {
    height: TOP_BAR_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  shadowPlaceholder: {
    width: SCREEN_WIDTH,
    height: TOP_BAR_HEIGHT,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      refreshAllBalances,
      resetStandbyTransactions,
      initializeSentryUserContext,
      exitBackupFlow,
      setLoading,
      showMessage,
      hideAlert,
    }
  )(withNamespaces(Namespaces.walletFlow5)(WalletHome))
)
