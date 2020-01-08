import ContactCircle from '@celo/react-components/components/ContactCircle'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { TransactionType } from 'src/apollo/types'
import { coinsIcon, unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

const AVATAR_SIZE = 40

interface Props {
  type: TransactionType
  recipient?: Recipient
  address?: string
}

export default function TransferFeedIcon(props: Props) {
  const { recipient, address, type } = props

  switch (type) {
    case TransactionType.VerificationFee: // fallthrough
    case TransactionType.Faucet: // fallthrough
    case TransactionType.InviteSent: // fallthrough
    case TransactionType.NetworkFee: // fallthrough
    case TransactionType.InviteReceived: {
      return <Image source={coinsIcon} style={styles.image} />
    }
    case TransactionType.VerificationReward: {
      return (
        <View style={styles.image}>
          <RewardIcon height={38} />
        </View>
      )
    }
    case TransactionType.Received: // fallthrough
    case TransactionType.Sent: // fallthrough
    case TransactionType.EscrowSent:
    case TransactionType.EscrowReceived:
    default: {
      return (
        <ContactCircle
          address={address}
          size={AVATAR_SIZE}
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
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
