import Touchable from '@celo/react-components/components/Touchable'
import { navigate } from '@celo/react-components/services/NavigationService'
import colors from '@celo/react-components/styles/colors'
import fontStyles, { fontFamily } from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { Trans, WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { MessagePhoneMapping } from 'src/app/reducer'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getDatetimeDisplayString, maskPhoneNumber } from 'src/utils/formatting'
import logger from 'src/utils/logger'

const tag = 'ActivityFeedItem'

interface StateProps {
  messagePhoneMapping: MessagePhoneMapping
}
interface OwnProps {
  timestamp: number
  value: string
  txComment: string
}

export type Props = StateProps & OwnProps & WithNamespaces

const mapStateToProps = (state: RootState) => ({
  messagePhoneMapping: state.app.messagePhoneMapping,
})

const getPhoneNumbersForVerifications = (
  messagePhoneMapping: MessagePhoneMapping,
  txComment: string
) => {
  // TODO: when blockchain-api knows about rewards transfers, we can probably remove this comment check
  const messageIds = txComment && txComment.split(',')
  if (!messageIds || !messageIds.length) {
    logger.warn(tag, 'Rewards transaction missing messages comment')
    return [maskPhoneNumber()]
  }

  const phoneNumbersSet = new Set()
  for (const messageId of messageIds) {
    if (messagePhoneMapping[messageId]) {
      phoneNumbersSet.add(messagePhoneMapping[messageId])
    } else {
      phoneNumbersSet.add(maskPhoneNumber())
    }
  }
  return Array.from(phoneNumbersSet)
}

class ActivityFeedItem extends React.PureComponent<Props> {
  navigateToTransactionReview = () => {
    const { timestamp, value, messagePhoneMapping, txComment } = this.props
    navigate(Screens.VerificationReview, {
      reviewProps: {
        timestamp,
        value,
        phoneNumbers: getPhoneNumbersForVerifications(messagePhoneMapping, txComment),
      },
    })
  }

  render() {
    const { timestamp, value, messagePhoneMapping, t, i18n, txComment } = this.props
    const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
    const phoneNumbers = getPhoneNumbersForVerifications(messagePhoneMapping, txComment)

    if (!phoneNumbers || !phoneNumbers.length) {
      return null
    }

    return (
      <Touchable onPress={this.navigateToTransactionReview}>
        <View style={styles.container}>
          <View style={styles.inside}>
            <View>
              <Text>
                {phoneNumbers.length === 1 ? (
                  <Text style={fontStyles.bodySecondary}>{maskPhoneNumber(phoneNumbers[0])}</Text>
                ) : (
                  <Trans i18nKey="rewardForCountVerifications">
                    <Text style={fontStyles.bodySecondary}>{{ count: phoneNumbers.length }}</Text>
                  </Trans>
                )}
              </Text>
              <Text style={[fontStyles.bodySmall, styles.date]}>{dateTimeFormatted}</Text>
            </View>
            <Text style={styles.deposit}>+ ${value}</Text>
          </View>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
  },
  inside: {
    paddingVertical: 15,
    flexDirection: 'row',
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkLightest,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deposit: {
    color: colors.celoGreen,
    fontSize: 18,
    fontFamily,
  },
  date: {
    color: colors.dark,
    lineHeight: 18,
  },
})

export default withNamespaces(Namespaces.profile)(
  connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(ActivityFeedItem)
)
