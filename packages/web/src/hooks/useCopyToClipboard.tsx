import * as React from 'react'
import { copyToClipboad } from 'src/utils/utils'

const MS_TO_RESET = 5000

export function useCopyToClipboard(): [boolean, (string: string) => void] {
  const [justCopied, setCopied] = React.useState(false)

  function copyText(text) {
    setCopied(true)
    copyToClipboad(text)
    setTimeout(() => {
      setCopied(false)
    }, MS_TO_RESET)
  }

  return [justCopied, copyText]
}
