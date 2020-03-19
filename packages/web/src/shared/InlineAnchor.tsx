import * as React from 'react'
import Button, { BTN } from 'src/shared/Button.3'

interface Props {
  children: string
  href: string
  target?: string
}

export default function InlineAnchor({ children, href, target }: Props) {
  return <Button text={children} target={target} href={href} kind={BTN.INLINE} />
}
