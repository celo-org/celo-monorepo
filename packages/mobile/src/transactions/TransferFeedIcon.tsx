import ContactCircle from '@celo/react-components/components/ContactCircle'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { coinsIcon, unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'

const avatarSize = 40

interface Props {
  type: TransactionTypes
  recipient?: Recipient
  address?: string
}

export default function TransferFeedIcon(props: Props) {
  const { recipient, address, type } = props

  switch (type) {
    case TransactionTypes.VERIFICATION_FEE: // fallthrough
    case TransactionTypes.FAUCET: // fallthrough
    case TransactionTypes.INVITE_SENT: // fallthrough
    case TransactionTypes.NETWORK_FEE: // fallthrough
    case TransactionTypes.INVITE_RECEIVED: {
      return <Image source={coinsIcon} style={styles.image} />
    }
    case TransactionTypes.VERIFICATION_REWARD: {
      return (
        <View style={styles.image}>
          <RewardIcon height={38} />
        </View>
      )
    }
    case TransactionTypes.RECEIVED: // fallthrough
    case TransactionTypes.SENT: // fallthrough
    default: {
      return (
        <ContactCircle
          address={address}
          size={avatarSize}
          thumbnailPath={getRecipientThumbnail(recipient)}
        >
          {<Image source={unknownUserIcon} style={styles.image} />}
        </ContactCircle>
      )
    }
  }
}

const styles = StyleSheet.create({
  image: {
    height: avatarSize,
    width: avatarSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
