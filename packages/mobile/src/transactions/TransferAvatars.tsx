import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import ContactCircle from 'src/components/ContactCircle'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import CircleArrowIcon from 'src/icons/CircleArrowIcon'
import { addressToDisplayNameSelector } from 'src/identity/reducer'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

interface Props {
  type: 'sent' | 'received'
  address?: string
  recipient?: Recipient
}

export default function TransferAvatars({ type, address, recipient }: Props) {
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const userPicture = addressToDisplayName[address || '']?.imageUrl

  const userAvatar = (
    <ContactCircle
      name={recipient ? recipient.displayName : null}
      address={address}
      thumbnailPath={userPicture || getRecipientThumbnail(recipient)}
    />
  )

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
