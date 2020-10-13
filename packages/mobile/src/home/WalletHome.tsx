import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import _ from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  RefreshControlProps,
  SectionList,
  SectionListData,
  StyleSheet,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { exitBackupFlow } from 'src/app/actions'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import NotificationBox from 'src/home/NotificationBox'
import { callToActNotificationSelector, getActiveNotificationCount } from 'src/home/selectors'
import SendOrRequestBar from 'src/home/SendOrRequestBar'
import { Namespaces, withTranslation } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { importContacts } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { initializeSentryUserContext } from 'src/sentry/actions'
import TransactionsList from 'src/transactions/TransactionsList'
import { checkContactsPermission } from 'src/utils/permissions'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  loading: boolean
  address?: string | null
  activeNotificationCount: number
  callToActNotification: boolean
  recipientCache: NumberToRecipient
  appConnected: boolean
  numberVerified: boolean
}

interface DispatchProps {
  refreshAllBalances: typeof refreshAllBalances
  initializeSentryUserContext: typeof initializeSentryUserContext
  exitBackupFlow: typeof exitBackupFlow
  setLoading: typeof setLoading
  showMessage: typeof showMessage
  importContacts: typeof importContacts
}

type Props = StateProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  refreshAllBalances,
  initializeSentryUserContext,
  exitBackupFlow,
  setLoading,
  showMessage,
  importContacts,
}

const mapStateToProps = (state: RootState): StateProps => ({
  loading: state.home.loading,
  address: currentAccountSelector(state),
  activeNotificationCount: getActiveNotificationCount(state),
  callToActNotification: callToActNotificationSelector(state),
  recipientCache: recipientCacheSelector(state),
  appConnected: isAppConnected(state),
  numberVerified: state.app.numberVerified,
})

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

interface State {
  isMigrating: boolean
}

export class WalletHome extends React.Component<Props, State> {
  scrollPosition: Animated.Value<number>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void

  constructor(props: Props) {
    super(props)

    this.scrollPosition = new Animated.Value(0)
    this.onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: this.scrollPosition } } }])
    this.state = { isMigrating: false }
  }

  onRefresh = async () => {
    this.props.refreshAllBalances()
  }

  componentDidMount = () => {
    // TODO find a better home for this, its unrelated to wallet home
    this.props.initializeSentryUserContext()
    if (SHOW_TESTNET_BANNER) {
      this.showTestnetBanner()
    }

    ValoraAnalytics.setUserAddress(this.props.address)

    // Waiting 1/2 sec before triggering to allow
    // rest of feed to load unencumbered
    setTimeout(this.tryImportContacts, 500)
  }

  tryImportContacts = async () => {
    const { numberVerified, recipientCache } = this.props

    // Only import contacts if number is verified and
    // recip cache is empty so we haven't already
    if (!numberVerified || recipientCache.length) {
      return
    }

    const hasGivenContactPermission = await checkContactsPermission()
    if (hasGivenContactPermission) {
      this.props.importContacts()
    }
  }

  renderSection = ({ section: { title } }: { section: SectionListData<any> }) => {
    if (!title) {
      return null
    }
    return <SectionHead text={title} />
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
    const { activeNotificationCount, callToActNotification } = this.props

    const refresh: React.ReactElement<RefreshControlProps> = (
      <RefreshControl
        refreshing={this.props.loading}
        onRefresh={this.onRefresh}
        colors={[colors.greenUI]}
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
      data: [{}],
      renderItem: () => (
        <TransactionsList key={'TransactionList'} currency={CURRENCY_ENUM.DOLLAR} />
      ),
    })

    return (
      <SafeAreaView style={styles.container}>
        <DrawerTopBar middleElement={<Logo />} scrollPosition={this.scrollPosition} />
        <AnimatedSectionList
          scrollEventThrottle={16}
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
    position: 'relative',
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(WalletHome))
