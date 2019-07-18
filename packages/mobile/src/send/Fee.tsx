import { fontStyles } from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface Props {
  fee: BigNumber
}

const Fee = ({ fee, t }: Props & WithNamespaces) => (
  <View>
    <View style={style.row}>
      <Text style={[fontStyles.bodySecondary]}>{t('fee') + ' '}</Text>
      <Text style={[fontStyles.body]}>{getMoneyDisplayValue(fee)}</Text>
    </View>
  </View>
)

const style = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default withNamespaces('sendFlow7')(Fee)
