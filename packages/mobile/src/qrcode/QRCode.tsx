import colors from '@celo/react-components/styles/colors.v2'
import variables from '@celo/react-components/styles/variables'
import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { shallowEqual, useSelector } from 'react-redux'
import { AvatarSelf } from 'src/components/AvatarSelf'
import QRCode from 'src/qrcode/QRGen'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
}

const mapStateToProps = (state: RootState) => {
  return {
    name: state.account.name,
    account: currentAccountSelector(state),
    e164Number: state.account.e164PhoneNumber,
  }
}

export default function QRCodeDisplay({ qrSvgRef }: Props) {
  const { name, account, e164Number } = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useMemo(
    () =>
      JSON.stringify({
        address: account,
        e164PhoneNumber: e164Number,
        displayName: name,
      }),
    [name, account, e164Number]
  )

  return (
    <SafeAreaView style={styles.container}>
      <AvatarSelf />
      <QRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
