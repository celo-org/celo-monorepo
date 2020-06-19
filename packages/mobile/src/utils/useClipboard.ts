import { useEffect, useState } from 'react'
import { AppState, Clipboard } from 'react-native'

const CLIPBOARD_CHECK_INTERVAL = 1000 // 1sec

export function useClipboard(): string {
  const [clipboardContent, setClipboardContent] = useState('')

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

  return clipboardContent
}
