import * as React from 'react'
import External from 'src/icons/External'
import { colors } from 'src/styles'

export default function Outbound({ url }: { url: string }) {
  return (
    <a href={externalize(url)} target="_blank">
      <External size={12} color={colors.dark} />
    </a>
  )
}

function externalize(url: string) {
  try {
    const uri = new URL(url)
    return uri.href
  } catch {
    return `//${url}`
  }
}
