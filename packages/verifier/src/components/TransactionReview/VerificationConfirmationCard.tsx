import Avatar from '@celo/react-components/components/Avatar'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { RootState } from 'src/redux/reducers'

export interface OwnProps {
  value: string
  phoneNumbers: string[]
}

interface StateProps {
  name: string
  e164Number: string
  accountAddress: string
  countryCode: string
}

type Props = OwnProps & StateProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    name: state.app.name || '',
    e164Number: state.app.e164Number || '',
    accountAddress: state.app.accountAddress || '',
    countryCode: state.app.countryCode || '',
  }
}

export class VerificationConfirmationCard extends React.Component<Props> {
  render() {
    const { value, phoneNumbers, name, e164Number, accountAddress, t } = this.props

    return (
      <View style={style.container}>
        <Avatar
          name={name}
          address={accountAddress}
          e164Number={e164Number}
          defaultCountryCode={this.props.countryCode}
          iconSize={55}
        />
        <View style={style.amountContainer}>
          <Text style={style.currencySymbol}>$</Text>
          <Text style={[fontStyles.body, style.amount]}>{value}</Text>
        </View>
        {phoneNumbers.map((number) => (
          <Text key={number} style={[fontStyles.body, style.reason]}>{`${t(
            'verified'
          )} ${number}`}</Text>
        ))}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    justifyContent: 'center',
    padding: 20,
  },
  amountContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  amount: {
    fontSize: 72,
    lineHeight: 90,
    color: colors.celoGreen,
  },
  currencySymbol: {
    fontSize: 30,
    lineHeight: 40,
    height: 35,
    color: colors.celoGreen,
  },
  reason: {
    fontSize: 18,
    color: colors.darkSecondary,
    alignSelf: 'center',
    textAlign: 'center',
    padding: 20,
  },
})

export default connect<StateProps>(mapStateToProps)(
  withNamespaces(Namespaces.profile)(VerificationConfirmationCard)
)
