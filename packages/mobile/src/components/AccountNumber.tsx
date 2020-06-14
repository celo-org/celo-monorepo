import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getAddressChunks } from '@celo/utils/src/address'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'

interface Props {
  address: string
  touchDisabled?: boolean
}

export default function AccountNumber({ address, touchDisabled }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const onPressAddress = () => {
    if (!address.length) {
      return
    }
    Clipboard.setString(address)
    Logger.showMessage(t('addressCopied'))
  }
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = ['0x', ...getAddressChunks(address)]

  if (touchDisabled) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.topText]}>{addressChunks.slice(0, 6).join(' ')}</Text>
        <Text style={[styles.text, styles.bottomText]}>{addressChunks.slice(6).join(' ')}</Text>
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPressAddress}>
      <Text style={[styles.text, styles.topText]}>{addressChunks.slice(0, 6).join(' ')}</Text>
      <Text style={[styles.text, styles.bottomText]}>{addressChunks.slice(6).join(' ')}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  topText: {
    textAlign: 'left',
  },
  bottomText: {
    textAlign: 'right',
  },
})
