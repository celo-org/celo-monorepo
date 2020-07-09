import ContactCircle from '@celo/react-components/components/ContactCircle'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import { transactionNetwork } from 'src/images/Images'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

const AVATAR_SIZE = 40

interface Props {
  type: TokenTransactionType
  recipient?: Recipient
  address?: string
}

export default function TransferFeedIcon(props: Props) {
  const { recipient, address, type } = props

  switch (type) {
    case TokenTransactionType.VerificationFee: // fallthrough
    case TokenTransactionType.Faucet: // fallthrough
    case TokenTransactionType.InviteSent: // fallthrough
    case TokenTransactionType.NetworkFee: // fallthrough
    case TokenTransactionType.InviteReceived: {
      return <Image source={transactionNetwork} style={styles.image} />
    }
    case TokenTransactionType.VerificationReward: {
      return (
        <View style={styles.image}>
          <RewardIcon height={38} />
        </View>
      )
    }
    case TokenTransactionType.Received: // fallthrough
    case TokenTransactionType.Sent: // fallthrough
    case TokenTransactionType.EscrowSent:
    case TokenTransactionType.EscrowReceived:
    default: {
      return (
        <ContactCircle
          address={address}
          name={recipient ? recipient.displayName : null}
          size={AVATAR_SIZE}
          thumbnailPath={getRecipientThumbnail(recipient)}
        />
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
