import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation } from 'react-native'
import { Namespaces } from 'src/i18n'
import { useClipboard } from 'src/utils/useClipboard'

interface Props {
  shouldShow: (clipboardContent: string) => boolean
  onPress: (clipboardContent: string) => void
}

export default function ClipboardAwarePasteButton({ shouldShow, onPress }: Props) {
  const { t } = useTranslation(Namespaces.global)
  const clipboardContent = useClipboard()
  const isVisible = shouldShow(clipboardContent)

  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [isVisible])

  function onPressInternal() {
    onPress(clipboardContent)
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
