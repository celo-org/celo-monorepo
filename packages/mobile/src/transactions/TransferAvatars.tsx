import React from 'react'
import { StyleSheet, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import CircleArrowIcon from 'src/icons/CircleArrowIcon'
import { Recipient } from 'src/recipients/recipient'

interface Props {
  type: 'sent' | 'received'
  recipient: Recipient
}

export default function TransferAvatars({ type, recipient }: Props) {
  const userAvatar = <ContactCircle recipient={recipient} />

  const selfAvatar = <ContactCircleSelf />

  return (
    <View style={[styles.container, type === 'sent' && styles.containerSent]}>
      {userAvatar}
      <CircleArrowIcon style={styles.arrow} />
      {selfAvatar}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerSent: {
    flexDirection: 'row-reverse',
  },
  arrow: {
    marginHorizontal: -8,
    zIndex: 1,
  },
})
