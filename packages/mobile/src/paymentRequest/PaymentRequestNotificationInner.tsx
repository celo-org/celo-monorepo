import { TFunction } from 'i18next'
import * as React from 'react'
import { getDisplayName, Recipient } from 'src/recipients/recipient'

interface Props {
  amount: string
  recipient: Recipient
  t: TFunction
}

export default function PaymentRequestNotificationInner(props: Props) {
  const { recipient, t } = props
  const displayName = getDisplayName(recipient, t)

  // Using a fragment to suppress a limitation with TypeScript and functional
  // components returning a string
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
  return <>{displayName}</>
}
