import Expandable from '@celo/react-components/components/Expandable'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { getDisplayNumberInternational } from '@celo/utils/src/phoneNumbers'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import AccountNumber from 'src/components/AccountNumber'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import {
  getDisplayName,
  Recipient,
  recipientHasAddress,
  recipientHasNumber,
} from 'src/recipients/recipient'

interface Props {
  type: 'sent' | 'received' | 'withdrawn'
  addressHasChanged?: boolean
  recipient: Recipient
  avatar: React.ReactNode
  expandable?: boolean
}

export default function UserSection({
  type,
  addressHasChanged = false,
  recipient,
  avatar,
  expandable = true,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const [expanded, setExpanded] = useState(expandable && addressHasChanged)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  const displayName = getDisplayName(recipient, t)
  const displayNumber = recipientHasNumber(recipient)
    ? getDisplayNumberInternational(recipient.e164PhoneNumber)
    : undefined
  const address = recipientHasAddress(recipient) ? recipient.address : ''

  const sectionLabel = {
    received: t('receivedFrom'),
    sent: t('sentTo'),
    withdrawn: t('withdrawnTo'),
  }[type]

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          <Touchable onPress={toggleExpanded} disabled={!expandable}>
            <>
              <Expandable isExpandable={expandable && !displayNumber} isExpanded={expanded}>
                <Text style={styles.username}>{displayName}</Text>
              </Expandable>
              {displayNumber && (
                <Expandable isExpandable={expandable && !!displayNumber} isExpanded={expanded}>
                  <Text style={styles.phoneNumber}>{displayNumber}</Text>
                </Expandable>
              )}
            </>
          </Touchable>
        </View>
        <View style={styles.avatarContainer}>{avatar}</View>
      </View>
      {expanded && (
        <View style={styles.expandedContainer}>
          {addressHasChanged && (
            <Text style={styles.addressHasChanged} testID={'transferAddressChanged'}>
              {t('transferAddressChanged')}
            </Text>
          )}
          <View style={styles.accountBox}>
            <Text style={styles.accountLabel}>{t('accountNumberLabel')}</Text>
            <AccountNumber address={address || ''} location={Screens.TransactionReview} />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
  },
  sectionLabel: {
    ...fontStyles.label,
    color: colors.gray3,
    marginBottom: 4,
  },
  userContainer: {
    flex: 1,
    marginRight: 8,
  },
  username: {
    ...fontStyles.regular,
    marginRight: 7,
  },
  phoneNumber: {
    ...fontStyles.small,
    color: colors.gray4,
    marginRight: 7,
  },
  avatarContainer: {
    justifyContent: 'center',
  },
  expandedContainer: {
    marginTop: 8,
  },
  addressHasChanged: {
    ...fontStyles.small,
    color: colors.gray5,
    marginBottom: 8,
  },
  accountBox: {
    borderRadius: 4,
    backgroundColor: colors.gray2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  accountLabel: {
    ...fontStyles.label,
    color: colors.gray4,
    marginRight: 30,
  },
})
