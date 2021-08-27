# Escrow

The `Escrow` contract utilizes Celo’s Lightweight identity feature to allow users to _send payments to other users who don’t yet have a public/private key pair or an address_. These payments are stored in this contract itself and can be either withdrawn by the intended recipient or reclaimed by the sender. This functionality supports _both_ versions of Celo’s lightweight identity: identifier-based \(such as a phone number to address mapping\) and privacy-based. This gives applications that intend to use this contract some flexibility in deciding which version of identity they prefer to use.

## How it works

If Alice wants to send a payment to Bob, who doesn’t yet have an associated address, she will send that payment to this `Escrow` contract and will also create a temporary public/private key pair. The associated temporary address will be referred to as the `paymentId`. Alice will then externally share the newly created temporary private key, also known as an _invitation_, to Bob, who will later use it to claim the payment. This paymentId will now be stored in this contract and will be mapped to relevant details related to this specific payment such as: the value of the payment, an optional identifier of the intended recipient, an optional amount of `attestations` the recipient must have before being able to withdraw the payment, an amount of time after which the payment will expire \(more on that in the “withdrawing” section below\), which asset is being transferred in this payment, etc.

## Withdrawing

The recipient of an escrowed payment can choose to withdraw their payment assuming they have successfully created their own public/private key pair and now have an address. To prove their identity, the recipient must be able to prove ownership of the paymentId’s private key, which should have been given to them by the original sender. If the sender set a minimum number of attestations required to withdraw the payment, that will also be checked in order to successfully withdraw. Following the same example as above, if Bob wants to withdraw the payment Alice sent him, he must sign a message with the private key given to him by Alice. The message will be the address of Bob’s newly created account. Bob will then be able to withdraw his payment by providing the paymentId and the v, r, and s outputs of the generated ECDSA signature.

## Revoking & Reclaiming

Alice sends Bob an escrowed payment. Let’s say Bob never withdraws it, or worse, the temporary private key he needs to withdraw the payment gets lost or sent to the wrong person. For this purpose, Celo’s protocol also allows for senders to reclaim any unclaimed escrowed payment that they sent. After an escrowed payment has expired \(each payment has its own expiry length that is set by the sender upon creation\), the sender of the payment can revoke the payment and reclaim their funds with just the paymentId.

