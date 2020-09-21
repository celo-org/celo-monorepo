import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Clipboard from '@react-native-community/clipboard'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation } from 'react-native'
import { Namespaces } from 'src/i18n'

interface Props {
  clipboardContent: string
  shouldShow: (clipboardContent: string) => boolean
  onPress: (clipboardContent: string) => void
}

export default function ClipboardAwarePasteButton({
  clipboardContent,
  shouldShow,
  onPress,
}: Props) {
  const { t } = useTranslation(Namespaces.global)
  const isVisible = shouldShow(clipboardContent)

  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [isVisible])

  async function onPressInternal() {
    onPress(clipboardContent || (await Clipboard.getString()))
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      text={t('paste')}
      type={BtnTypes.ONBOARDING}
      rounded={false}
      size={BtnSizes.FULL}
      onPress={onPressInternal}
      testID={'PasteButton'}
    />
  )
}
