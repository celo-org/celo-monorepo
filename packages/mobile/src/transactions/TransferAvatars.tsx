import ContactCircle from '@celo/react-components/components/ContactCircle'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import CircleArrowIcon from 'src/icons/CircleArrowIcon'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

const AVATAR_SIZE = 40

interface Props {
  type: 'sent' | 'received'
  address?: string
  recipient?: Recipient
}

export default function TransferAvatars({ type, address, recipient }: Props) {
  const userAvatar = (
    <ContactCircle
      name={recipient ? recipient.displayName : null}
      address={address}
      size={AVATAR_SIZE}
      thumbnailPath={getRecipientThumbnail(recipient)}
    />
  )

  const selfAvatar = <ContactCircleSelf size={AVATAR_SIZE} />

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
