import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'

import * as lFounder from 'validator-badges/001-stake-off-founder-validator.md'
import * as lAttestation from 'validator-badges/002-stake-off-attestation-maven.md'
import * as lMaster from 'validator-badges/003-stake-off-master-validator.md'
import * as lGenesis from 'validator-badges/004-genesis-validator.md'
import * as lProposer from 'validator-badges/005-genesis-1st-proposer.md'
import * as lTransaction from 'validator-badges/006-genesis-1st-transaction.md'
import * as lVote from 'validator-badges/007-celo-foundation-vote-recipient.md'

const allBadges = [
  { src: '/images/badges/1st-proposer.svg', list: lProposer, title: '1st Proposer' },
  { src: '/images/badges/1st-transaction.svg', list: lTransaction, title: '1st Transaction' },
  { src: '/images/badges/attestation.svg', list: lAttestation, title: 'Genesis Validator' },
  { src: '/images/badges/founder-validator.svg', list: lFounder, title: 'Master Validator' },
  { src: '/images/badges/genesis-validator.svg', list: lGenesis, title: 'Founder Validator' },
  { src: '/images/badges/master-validator.svg', list: lMaster, title: 'Attestation Maven' },
  { src: '/images/badges/vote-recipient.svg', list: lVote, title: 'Vote Recipient' },
].map((badge) => ({ ...badge, list: new Set(String(badge.list).split('/n')) }))

interface Props {
  address: string
}

class ValidatorsListBadges extends React.PureComponent<Props & I18nProps> {
  render() {
    const { address } = this.props

    const badges = allBadges.filter(({ list }) => list.has(address.toLowerCase()))

    return (
      <View style={styles.container}>
        {badges.map(({ src, title }) => (
          <img key={src} src={src} title={title} />
        ))}
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListBadges)

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'flex-start',
    paddingTop: 4,
    flexDirection: 'row',
  },
})
