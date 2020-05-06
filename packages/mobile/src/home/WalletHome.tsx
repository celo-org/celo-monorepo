import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import SettingsIcon from '@celo/react-components/icons/Settings'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles, TOP_BAR_HEIGHT } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as _ from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  Animated,
  RefreshControl,
  RefreshControlProps,
  SectionList,
  SectionListData,
  StyleSheet,
  View,
} from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { BoxShadow } from 'react-native-shadow'
import { connect } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exitBackupFlow } from 'src/app/actions'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import CeloDollarsOverview from 'src/home/CeloDollarsOverview'
import HeaderButton from 'src/home/HeaderButton'
import NotificationBox from 'src/home/NotificationBox'
import { callToActNotificationSelector, getActiveNotificationCount } from 'src/home/selectors'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { withDispatchAfterNavigate } from 'src/navigator/WithDispatchAfterNavigate'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { initializeSentryUserContext } from 'src/sentry/actions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { resetStandbyTransactions } from 'src/transactions/actions'
import TransactionsList from 'src/transactions/TransactionsList'
import { currentAccountSelector } from 'src/web3/selectors'

const SCREEN_WIDTH = variables.width
const HEADER_ICON_SIZE = 24
const HEADER_BUTTON_MARGIN = 12

interface StateProps {
  loading: boolean
  address?: string | null
  activeNotificationCount: number
  callToActNotification: boolean
  recipientCache: NumberToRecipient
  appConnected: boolean
}

interface DispatchProps {
  refreshAllBalances: typeof refreshAllBalances
  resetStandbyTransactions: typeof resetStandbyTransactions
  initializeSentryUserContext: typeof initializeSentryUserContext
  exitBackupFlow: typeof exitBackupFlow
  setLoading: typeof setLoading
  showMessage: typeof showMessage
}

type Props = StateProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  refreshAllBalances,
  resetStandbyTransactions,
  initializeSentryUserContext,
  exitBackupFlow,
  setLoading,
  showMessage,
}

const mapStateToProps = (state: RootState): StateProps => ({
  loading: state.home.loading,
  address: currentAccountSelector(state),
  activeNotificationCount: getActiveNotificationCount(state),
  callToActNotification: callToActNotificationSelector(state),
  recipientCache: recipientCacheSelector(state),
  appConnected: isAppConnected(state),
})

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

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
export class WalletHome extends React.Component<Props> {
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
    if (SHOW_TESTNET_BANNER) {
      this.showTestnetBanner()
    }
  }

  renderSection = ({ section: { title, bubbleText } }: { section: SectionListData<any> }) => {
    if (!title) {
      return null
    }
    return <SectionHeadNew text={title} bubbleText={bubbleText} />
  }

  keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  showTestnetBanner = () => {
    const { t } = this.props
    this.props.showMessage(
      t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
      ALERT_BANNER_DURATION,
      null,
      t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
    )
  }

  onPressQrCode = () => {
    navigate(Screens.QRCode)
  }

  onPressSettings = () => {
    navigate(Screens.Account)
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
        data: [{}],
        renderItem: () => <NotificationBox key={'NotificationBox'} />,
        bubbleText: activeNotificationCount ? activeNotificationCount.toString() : null,
      })
    }

    sections.push({
      title: t('activity'),
      data: [{}],
      renderItem: () => (
        <TransactionsList key={'TransactionList'} currency={CURRENCY_ENUM.DOLLAR} />
      ),
    })

    return (
      <SafeAreaView style={styles.container}>
        {/* Why this mess? Android only has shadows from elevation, and we have to fade in under
            If we use elevation, it appears on top of the title. The box shadow enables to fade
            in a shadow from underneath */}
        <Animated.View style={[styles.shadowContainer, { opacity: this.shadowOpacity }]}>
          <BoxShadow setting={SHADOW_STYLE}>
            <View style={styles.shadowPlaceholder} />
          </BoxShadow>
        </Animated.View>
        <View style={[componentStyles.topBar, styles.header]}>
          {this.props.appConnected ? (
            <Animated.Text style={[fontStyles.headerTitle, { opacity: this.headerOpacity }]}>
              {t('wallet')}
            </Animated.Text>
          ) : (
            <View style={styles.banner}>
              <DisconnectBanner />
            </View>
          )}
          <View style={styles.headerRight}>
            <HeaderButton style={styles.headerButton} onPress={this.onPressQrCode}>
              <QRCodeBorderlessIcon height={HEADER_ICON_SIZE} color={colors.celoGreen} />
            </HeaderButton>
            <HeaderButton style={styles.headerButton} onPress={this.onPressSettings}>
              <SettingsIcon height={HEADER_ICON_SIZE} color={colors.celoGreen} />
            </HeaderButton>
          </View>
        </View>
        {/*
        // @ts-ignore */}
        <AnimatedSectionList
          onScroll={this.onScroll}
          refreshControl={refresh}
          onRefresh={this.onRefresh}
          refreshing={this.props.loading}
          style={styles.container}
          sections={sections}
          stickySectionHeadersEnabled={true}
          renderSectionHeader={this.renderSection}
          ListHeaderComponent={CeloDollarsOverview}
          keyExtractor={this.keyExtractor}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  banner: { paddingVertical: 15, marginTop: 50 },
  containerFeed: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerRight: {
    position: 'absolute',
    top: 0,
    right: variables.contentPadding - HEADER_BUTTON_MARGIN,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    justifyContent: 'flex-end',
    margin: HEADER_BUTTON_MARGIN,
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

export default withDispatchAfterNavigate(
  componentWithAnalytics(
    connect<StateProps, DispatchProps, {}, RootState>(
      mapStateToProps,
      mapDispatchToProps
    )(withTranslation(Namespaces.walletFlow5)(WalletHome))
  )
)
