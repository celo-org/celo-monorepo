import Expandable from '@celo/react-components/components/Expandable'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getAddressChunks } from '@celo/utils/src/address'
import { getDisplayNumberInternational } from '@celo/utils/src/phoneNumbers'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import AccountNumber from 'src/components/AccountNumber'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'

function getDisplayName(recipient?: Recipient, e164Number?: string, address?: string) {
  if (recipient && recipient.displayName) {
    return recipient.displayName
  }
  const number = getDisplayNumber(e164Number, recipient)
  if (number) {
    return number
  }
  if (address) {
    // TODO: extract this into a reusable getShortAddressDisplay function
    const addressChunks = getAddressChunks(address)
    return `0x ${addressChunks[0]}…${addressChunks[addressChunks.length - 1]}`
  }

  return undefined
}

function getDisplayNumber(e164Number?: string, recipient?: Recipient) {
  const number = e164Number || recipient?.e164PhoneNumber
  if (!number) {
    return undefined
  }
  return getDisplayNumberInternational(number)
}

interface Props {
  type: 'sent' | 'received'
  address?: string
  addressHasChanged?: boolean
  e164PhoneNumber?: string
  recipient?: Recipient
  avatar: React.ReactNode
}

export default function UserSection({
  type,
  address,
  addressHasChanged = false,
  recipient,
  e164PhoneNumber,
  avatar,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const [expanded, setExpanded] = useState(addressHasChanged)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  const displayName = getDisplayName(recipient, e164PhoneNumber, address)
  const displayNumber = getDisplayNumber(e164PhoneNumber, recipient)
  const e164Number = displayName !== displayNumber ? displayNumber : undefined

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <Text style={styles.sectionLabel}>
            {type === 'received' ? t('receivedFrom') : t('sentTo')}
          </Text>
          <Touchable onPress={toggleExpanded}>
            <>
              <Expandable isExpandable={!e164Number} isExpanded={expanded}>
                <Text style={styles.username}>{displayName}</Text>
              </Expandable>
              <Expandable isExpandable={!!e164Number} isExpanded={expanded}>
                <Text style={styles.phoneNumber}>{e164Number}</Text>
              </Expandable>
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
