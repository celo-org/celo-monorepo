import * as React from 'react'
import Button, { BTN } from 'src/shared/Button.3'

interface Props {
  children: string
  href: string
}

export default function InlineAnchor({ children, href }: Props) {
  return <Button text={children} href={href} kind={BTN.INLINE} />
}
