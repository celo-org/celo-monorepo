import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, Clipboard, LayoutAnimation, StyleSheet } from 'react-native'
import { Namespaces } from 'src/i18n'

const CLIPBOARD_CHECK_INTERVAL = 1000 // 1sec

interface Props {
  shouldShow: (clipboardContent: string) => boolean
  onPress: (clipboardContent: string) => void
}

export default function ClipboardAwarePasteButton({ shouldShow, onPress }: Props) {
  const [clipboardContent, setClipboardContent] = useState('')
  const { t } = useTranslation(Namespaces.global)

  useEffect(() => {
    let isMounted = true

    async function checkClipboardContent() {
      try {
        const newClipboardContent = await Clipboard.getString()
        if (!isMounted) {
          return
        }

        setClipboardContent(newClipboardContent)
      } catch (error) {
        console.error('Error checking clipboard contents', error)
      }
    }

    const interval = setInterval(checkClipboardContent, CLIPBOARD_CHECK_INTERVAL)

    AppState.addEventListener('change', checkClipboardContent)

    checkClipboardContent().catch(() => {
      // Ignored
    })

    return () => {
      isMounted = false
      AppState.removeEventListener('change', checkClipboardContent)
      clearInterval(interval)
    }
  }, [])

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
      style={styles.container}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
  },
})
