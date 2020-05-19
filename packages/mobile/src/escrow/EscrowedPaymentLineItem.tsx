import * as React from 'react'
import { EscrowedPayment } from 'src/escrow/actions'

interface Props {
  payment: EscrowedPayment
}

export default function EscrowedPaymentLineItem(props: Props) {
  const { recipientPhone } = props.payment

  // Using a fragment to suppress a limitation with TypeScript and functional
  // components returning a string
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
  return <>{recipientPhone}</>
}
