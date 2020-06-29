import * as React from 'react'
import { View, StyleSheet } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'

import * as lFounder from 'validator-badges/001-stake-off-founder-validator.md'
import * as lAttestation from 'validator-badges/002-stake-off-attestation-maven.md'
import * as lMaster from 'validator-badges/003-stake-off-master-validator.md'
import * as lGenesis from 'validator-badges/004-genesis-validator.md'
import * as lProposer from 'validator-badges/005-genesis-1st-proposer.md'
import * as lTransaction from 'validator-badges/006-genesis-1st-transaction.md'
import * as lVote from 'validator-badges/007-celo-foundation-vote-recipient.md'

const allBadges = [
  { src: '/images/badges/1st-proposer.svg', list: lProposer },
  { src: '/images/badges/1st-transaction.svg', list: lTransaction },
  { src: '/images/badges/attestation.svg', list: lAttestation },
  { src: '/images/badges/founder-validator.svg', list: lFounder },
  { src: '/images/badges/genesis-validator.svg', list: lGenesis },
  { src: '/images/badges/master-validator.svg', list: lMaster },
  { src: '/images/badges/vote-recipient.svg', list: lVote },
].map((_) => ({ ..._, list: (_.list as any).toLowerCase() as string }))

interface Props {
  address: string
}

class ValidatorsListBadges extends React.PureComponent<Props & I18nProps> {
  state = {
    address: undefined,
  }

  render() {
    const { address } = this.props

    const badges = allBadges.filter(({ list }) => list.includes(address.toLowerCase()))

    return (
      <View style={styles.container}>
        {badges.map(({ src }) => (
          <img key={src} src={src} />
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
