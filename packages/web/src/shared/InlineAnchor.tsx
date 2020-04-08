import * as React from 'react'
import Button, { BTN } from 'src/shared/Button.3'

interface Props {
  children: string
  href: string
  target?: string
  onPress?: () => void
}

export default function InlineAnchor({ children, href, target, onPress }: Props) {
  return <Button text={children} onPress={onPress} target={target} href={href} kind={BTN.INLINE} />
}
