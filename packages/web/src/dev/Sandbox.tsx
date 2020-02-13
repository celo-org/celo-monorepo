import { StyleSheet, Text, View } from 'react-native'
import { H2, H3 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export default function Sandbox() {
  return (
    <View style={standardStyles.darkBackground}>
      <GridRow>
        <Cell span={Spans.full}>
          <H3 style={textStyles.invert}>Try it Out</H3>
          <H2 style={[textStyles.invert, standardStyles.elementalMargin]}>
            Sample Celo Integration
          </H2>
          <Text style={[fonts.p, textStyles.invert]}>
            This code snippet creates an account and transfers Celo Dollars to the account.
          </Text>
          <View style={standardStyles.centered}>
            <View style={[standardStyles.blockMarginMobile, styles.codeBox]}>
              <code style={{ color: colors.gray, padding: 20 }}>const Web3 = require('web3')</code>
              <code style={{ color: colors.gray, padding: 20 }}>
                const ContractKit = require('@celo/contractkit')
              </code>
              <code style={{ color: colors.gray, padding: 20 }}>
                const provider = new
                Web3.providers.HttpProvider(`https://alfajores-forno.celo-testnet.org`)
              </code>
              <code style={{ color: colors.gray, padding: 20 }}>
                const web3 = new Web3(provider)
              </code>
              <code style={{ color: colors.gray, padding: 20 }}>
                const contractKit = ContractKit.newKitFromWeb3(web3)
              </code>
              <View style={[{ position: 'absolute', right: 0, bottom: 0 }]}>
                <Button
                  kind={BTN.PRIMARY}
                  href="https://repl.it/@annakaz/contractkit"
                  text="Try out the Code"
                  target="_blank"
                />
              </View>
            </View>
          </View>
        </Cell>
      </GridRow>
    </View>
  )
}

const styles = StyleSheet.create({
  codeBox: {
    backgroundColor: colors.black,
    height: 400,
    borderColor: colors.greenScreen,
    borderWidth: 1,
    width: '100%',
  },
})
