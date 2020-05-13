import Button, { BtnSizes } from '@celo/react-components/components/Button.v2'
import Touchable from '@celo/react-components/components/Touchable'
import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import colors from '@celo/react-components/styles/colors.v2'
import variables from '@celo/react-components/styles/variables'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'

interface Props {}

export default function SendOrRequestBar(props: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)

  const onPressSend = useCallback(() => {
    // TODO: use new send flow
    navigate(Stacks.SendStack)
  }, [])

  const onPressRequest = useCallback(() => {
    // TODO: use new request flow
    navigate(Stacks.SendStack)
  }, [])

  const onPressQrCode = useCallback(() => {
    navigate(Screens.QRCode)
  }, [])

  return (
    <View style={styles.container}>
      <Button style={styles.button} size={BtnSizes.SMALL} text={t('send')} onPress={onPressSend} />
      <Button
        style={[styles.button, styles.requestButton]}
        size={BtnSizes.SMALL}
        text={t('request')}
        onPress={onPressRequest}
      />
      <Touchable borderless={true} onPress={onPressQrCode}>
        <QRCodeBorderlessIcon height={32} color={colors.greenUI} />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
  },
  requestButton: {
    marginHorizontal: 12,
  },
})
