import RewardIcon from '@celo/react-components/icons/RewardIcon'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import ContactCircle from 'src/components/ContactCircle'
import { transactionNetwork } from 'src/images/Images'
import { Recipient } from 'src/recipients/recipient'

const AVATAR_SIZE = 40

interface Props {
  type: TokenTransactionType
  recipient: Recipient
}

export default function TransferFeedIcon(props: Props) {
  const { recipient, type } = props

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
      return <ContactCircle recipient={recipient} size={AVATAR_SIZE} />
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
