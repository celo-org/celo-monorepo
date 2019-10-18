import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { TranslationFunction } from 'i18next'
import { Namespaces } from 'locales'
import * as React from 'react'
import { Query } from 'react-apollo'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { createMessagePhoneMapping, setTotalEarnings, setTotalMessages } from 'src/app/actions'
import ActivityFeedItem from 'src/components/HomeScreen/ActivityFeedItem'
import { shinyDollar } from 'src/images/Images'

interface StateProps {
  accountAddress: string
  isVerifying: boolean
}

interface DispatchProps {
  setTotalEarnings: typeof setTotalEarnings
  setTotalMessages: typeof setTotalMessages
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapDispatchToProps = {
  setTotalEarnings,
  setTotalMessages,
}

export const rewardsQuery = gql`
  query VerifierRewards($address: String!) {
    rewards(address: $address) {
      ... on Transfer {
        type
        hash
        value
        symbol
        timestamp
        address
        comment
      }
    }
  }
`
class RewardsTransactionsQuery extends Query<
  RewardsTransactionsData,
  RewardsTransactionsVariables
> {}

interface RewardsTransactionsVariables {
  address: string
}

interface RewardsTransactionsData {
  rewards?: Array<RewardTransaction | null> | null
}

interface RewardTransaction {
  address: string
  comment: string
  hash: string
  symbol: string
  timestamp: number
  type: string
  value: number
}

const renderEmptyFeed = (isVerifying: boolean, t: TranslationFunction) => {
  if (isVerifying) {
    return (
      <View style={styles.container}>
        <SectionHead text={t('activity')} />
        <View style={styles.emptyFeed}>
          <Image style={styles.emptyIcon} source={shinyDollar} resizeMode={'contain'} />
          <Text style={[fontStyles.bodySecondary, styles.statusText]}>{t('noFeedActivity')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.emptyFeed, styles.off]}>
      <Text style={[fontStyles.bodySecondary, styles.statusText]}>
        {t('turnMobileVerifyingOn')}
      </Text>
    </View>
  )
}

const txKeyExtractor = (transaction: RewardTransaction | null, index: number) => index.toString()
const renderFeedItem = ({ item: reward }: { item: RewardTransaction | null }) => {
  if (!reward) {
    return null
  }
  return (
    <ActivityFeedItem
      timestamp={reward.timestamp}
      value={String(reward.value)}
      txComment={reward.comment}
    />
  )
}

export class Activity extends React.Component<Props> {
  onQueryCompleted = (data: RewardsTransactionsData) => {
    if (!data || !data.rewards || !data.rewards.length) {
      return
    }
    this.updateStats(data.rewards)
    createMessagePhoneMapping().catch((err) => {
      console.error(`createMessagePhoneMapping() error`, err)
    })
  }

  updateStats = (rewards: Array<RewardTransaction | null>) => {
    this.props.setTotalEarnings(
      rewards
        .reduce(
          (sum, reward) => sum.plus((reward && new BigNumber(reward.value)) || 0),
          new BigNumber(0)
        )
        .decimalPlaces(2)
        .toNumber()
    )

    // To compute TotalMessages, count the number of distinct messageIds
    // which is being included in the transaction comments
    this.props.setTotalMessages(
      rewards.reduce(
        (sum, reward) =>
          sum + ((reward && reward.comment && reward.comment.split(',').length) || 1),
        0
      )
    )
  }

  render() {
    const { accountAddress, isVerifying, t } = this.props
    if (!accountAddress) {
      return renderEmptyFeed(isVerifying, t)
    }

    return (
      <RewardsTransactionsQuery
        query={rewardsQuery}
        pollInterval={5000}
        variables={{ address: accountAddress }}
        onCompleted={this.onQueryCompleted}
      >
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <View style={styles.container}>
                <SectionHead text={t('activity')} />
                <View style={styles.emptyFeed}>
                  <ActivityIndicator
                    style={styles.loadingIcon}
                    size="large"
                    color={colors.celoGreen}
                  />
                  <Text>{t('loadingFeed')}</Text>
                </View>
              </View>
            )
          }

          if (error) {
            return (
              <View style={styles.container}>
                <SectionHead text={t('activity')} />
                <View style={styles.emptyFeed}>
                  <View style={styles.circleRed} />
                  <Text style={[fontStyles.bodySecondary, styles.statusText]}>
                    {t('errorLoadingFeed.0')}
                  </Text>
                  <Text style={[fontStyles.bodySecondary, styles.statusText]}>
                    {t('errorLoadingFeed.1')}
                  </Text>
                </View>
              </View>
            )
          }

          if (data && data.rewards && data.rewards.length) {
            return (
              <View style={styles.container}>
                <SectionHead text={t('activity')} />
                <FlatList
                  data={data.rewards}
                  keyExtractor={txKeyExtractor}
                  renderItem={renderFeedItem}
                />
              </View>
            )
          }

          return renderEmptyFeed(isVerifying, t)
        }}
      </RewardsTransactionsQuery>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyFeed: {
    flex: 1,
    paddingHorizontal: 35,
    paddingVertical: 30,
    alignItems: 'center',
  },
  off: {
    backgroundColor: colors.inactiveLabelBar,
  },
  statusText: {
    marginTop: 10,
    textAlign: 'center',
  },
  loadingIcon: {
    marginBottom: 15,
    height: 60,
    width: 65,
  },
  loadingError: {
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 15,
    height: 108,
    width: 108,
  },
  circleRed: {
    marginVertical: 20,
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: colors.errorRed,
  },
})

export default withNamespaces(Namespaces.profile)(
  connect(
    null,
    mapDispatchToProps
  )(Activity)
)
