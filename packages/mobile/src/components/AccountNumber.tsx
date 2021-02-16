import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { getAddressChunks } from '@celo/utils/src/address'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

interface Props {
  address: string
  touchDisabled?: boolean
  location?: Screens
}

export default function AccountNumber({ address, touchDisabled, location }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const onPressAddress = () => {
    if (!address.length) {
      return
    }
    Clipboard.setString(address)
    Logger.showMessage(t('addressCopied'))

    if (location === Screens.DrawerNavigator) {
      ValoraAnalytics.track(HomeEvents.drawer_address_copy)
    }

    if (location === Screens.TransactionReview) {
      ValoraAnalytics.track(HomeEvents.transaction_feed_address_copy)
    }
  }
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = getAddressChunks(address)

  const formattedAddress = (
    <>
      <View style={[styles.line]}>
        <View style={[styles.miniChunk]}>
          <Text style={[styles.text]}>0x</Text>
        </View>
        {addressChunks.slice(0, 5).map((chunk, i) => (
          <View key={i} style={[styles.chunk]}>
            <Text style={[styles.text]}>{chunk}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.line]}>
        <View style={[styles.miniChunk]} />
        {addressChunks.slice(5).map((chunk, i) => (
          <View key={i} style={[styles.chunk]}>
            <Text style={[styles.text]}>{chunk}</Text>
          </View>
        ))}
      </View>
    </>
  )

  return touchDisabled ? (
    <View style={styles.container}>{formattedAddress}</View>
  ) : (
    <TouchableOpacity
      style={styles.container}
      onLongPress={onPressAddress}
      onPress={onPressAddress}
    >
      {formattedAddress}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 215,
  },
  line: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  miniChunk: {
    width: 23,
  },
  chunk: {
    width: 40,
  },
})
