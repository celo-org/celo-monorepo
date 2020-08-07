// VIEW Paste icon that disappears when the |currentValue| passed matches the content
// of the clipboard.

import TouchableDefault from '@celo/react-components/components/Touchable'
import Paste from '@celo/react-components/icons/Paste.v2'
import { iconHitslop } from '@celo/react-components/styles/variables'
import React, { useEffect, useRef, useState } from 'react'
import { AppState, Clipboard, StyleProp, ViewStyle } from 'react-native'

interface PasteAwareProps {
  style?: StyleProp<ViewStyle>
  color: string
  onPress: (text: string) => void
  currentValue: string
}

function ClipboardAwarePasteIcon({ currentValue, style, color, onPress }: PasteAwareProps) {
  const [isPasteIconVisible, setPasteIconVisible] = useState(false)
  const [clipboardContent, setClipboardContent] = useState('')

  const currentValueRef = useRef<string>()
  useEffect(() => {
    currentValueRef.current = currentValue
  })

  const checkClipboardContents = async () => {
    try {
      const clipboardString = await Clipboard.getString()
      if (clipboardString && currentValueRef.current !== clipboardString) {
        setPasteIconVisible(true)
        setClipboardContent(clipboardString)
      } else {
        setPasteIconVisible(false)
        setClipboardContent('')
      }
    } catch (error) {
      console.error('Error checking clipboard contents', error)
    }
  }

  useEffect(() => {
    AppState.addEventListener('change', checkClipboardContents)
    const interval = setInterval(async () => {
      await checkClipboardContents()
    }, 1000) // Every 1s

    checkClipboardContents().catch()

    return () => {
      AppState.removeEventListener('change', checkClipboardContents)
      clearInterval(interval)
    }
  }, [])

  const onPressPaste = () => {
    if (!clipboardContent) {
      console.error('Attempted to paste but clipboard content empty. Should never happen.')
      return
    }
    setPasteIconVisible(false)
    setClipboardContent('')
    onPress(clipboardContent)
  }

  if (!isPasteIconVisible) {
    return null
  }

  return (
    <TouchableDefault style={style} onPress={onPressPaste} hitSlop={iconHitslop}>
      <Paste color={color} />
    </TouchableDefault>
  )
}

export default ClipboardAwarePasteIcon
