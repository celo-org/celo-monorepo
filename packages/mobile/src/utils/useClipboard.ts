import Clipboard from '@react-native-community/clipboard'
import { useEffect, useState } from 'react'
import { AppState, Platform } from 'react-native'
import Logger from 'src/utils/Logger'

const CLIPBOARD_CHECK_INTERVAL = 1000 // 1sec

export function useClipboard(): [boolean, string] {
  const [forceShowingPasteIcon, setForceShowingPasteIcon] = useState(false)
  const [clipboardContent, setClipboardContent] = useState('')

  useEffect(() => {
    let isMounted = true

    async function checkClipboardContent() {
      try {
        const majorVersionIOS = parseInt(Platform.Version.toString(), 10)
        if (Platform.OS === 'ios' && majorVersionIOS >= 14) {
          setForceShowingPasteIcon(await Clipboard.hasString())
          return
        }

        const newClipboardContent = await Clipboard.getString()
        if (!isMounted) {
          return
        }

        setClipboardContent(newClipboardContent)
      } catch (error) {
        Logger.error('Error checking clipboard contents', error)
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

  return [forceShowingPasteIcon, clipboardContent]
}
