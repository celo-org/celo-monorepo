import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import colors from '@celo/react-components/styles/colors'
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
} from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { exitBackupFlow } from 'src/app/actions'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import NotificationBox from 'src/home/NotificationBox'
import { callToActNotificationSelector, getActiveNotificationCount } from 'src/home/selectors'
import SendOrRequestBar from 'src/home/SendOrRequestBar'
import { Namespaces, withTranslation } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { initializeSentryUserContext } from 'src/sentry/actions'
import TransactionsList from 'src/transactions/TransactionsList'
import { currentAccountSelector } from 'src/web3/selectors'

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
  initializeSentryUserContext: typeof initializeSentryUserContext
  exitBackupFlow: typeof exitBackupFlow
  setLoading: typeof setLoading
  showMessage: typeof showMessage
}

type Props = StateProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  refreshAllBalances,
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

export class WalletHome extends React.Component<Props> {
  animatedValue: Animated.Value
  headerOpacity: Animated.AnimatedInterpolation
  onScroll: () => void

  constructor(props: Props) {
    super(props)

    this.animatedValue = new Animated.Value(0)
    this.headerOpacity = this.animatedValue.interpolate({
      inputRange: [0, HEADER_FADE_HEIGHT],
      outputRange: [0, 1],
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
    // TODO find a better home for this, its unrelated to wallet home
    this.props.initializeSentryUserContext()
    if (SHOW_TESTNET_BANNER) {
      this.showTestnetBanner()
    }
  }

  renderSection = ({ section: { title } }: { section: SectionListData<any> }) => {
    if (!title) {
      return null
    }
    return <SectionHeadNew text={title} />
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
        <DrawerTopBar />
        <AnimatedSectionList
          onScroll={this.onScroll}
          refreshControl={refresh}
          onRefresh={this.onRefresh}
          refreshing={this.props.loading}
          style={styles.container}
          sections={sections}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={this.renderSection}
          keyExtractor={this.keyExtractor}
        />
        <SendOrRequestBar />
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
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.walletFlow5)(WalletHome))
