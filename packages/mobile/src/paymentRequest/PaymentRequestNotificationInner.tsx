import * as React from 'react'
import { Recipient } from 'src/recipients/recipient'

interface Props {
  amount: string
  recipient: Recipient
}

export default function PaymentRequestNotificationInner(props: Props) {
  const { recipient } = props
  const displayName = recipient.displayName

  // Using a fragment to suppress a limitation with TypeScript and functional
  // components returning a string
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
  return <>{displayName}</>
}
