# Invitations

## **Overview**

To be able to use the wallet and create an account, a user must be invited through their phone number by a verified user. The inviter will send an _invitation code_ to the invitee, which they can later redeem upon downloading the app.

## **Sending Invitations**

If Alice is verified, she can invite \(unverified\) Bob to the app by choosing him through her contacts list in the wallet or by inputting his phone number. This will generate a temporary public/private key pair and associated temporary wallet address. Alice will have to pay a small invitation fee to this temporary wallet. Finally, Alice's wallet app will auto populate a message including this temporary private key, now known as invitation code, and will prompt Alice to send this message to Bob through either SMS or WhatsApp.

{% hint style="info" %}
Note: The invitation fee allows for invitees to be able to pay for verification fees and complete the [verification](verification.md) process upon redemption of the invitation code.
{% endhint %}

Along with an invite, inviters also have the option of sending a payment. In the example above, Alice will send this payment to an [escrow](../../protocol/transactions/escrow.md) smart contract which maps the temporary wallet address associated with the invitation code/temporary private key with the specific payment.

## Escrow and Redeeming Invites

After downloading the wallet app, Bob can redeem the invitation code that Alice sent him by inputting it into the app's homepage. During the invitation code redemption process:

* A new public/private key pair and corresponding wallet address is generated \(which only Bob has access to\). This is his permanent wallet address.
* Bob proves ownership of the temporary wallet address since he can provide its corresponding private key \(which is the invitation code\).
* Bob then transfers the invitation fee held in the temporary wallet to his newly created permanent wallet.
* Bob is then prompted to the [verification](verification.md) screen.

If the invite code is attached to an [escrowed payment](../../protocol/transactions/escrow.md) then, upon finishing verification, the payment will be automatically withdrawn and those funds will be transferred into the user’s account.

{% hint style="info" %}
Note: If a user has been invited by multiple people and they all sent payments along with the invite, the user will only be able to redeem the payment corresponding to the invite code they chose to use initially. The original senders of the rest of the unclaimed payments will be able to reclaim those funds and resend the payment to the new wallet associated to the now-verified user.
{% endhint %}

