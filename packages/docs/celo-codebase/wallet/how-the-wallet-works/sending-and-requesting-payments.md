# Payments and Exchanging

## **Payments**

### **Sending**

The Celo Wallet can be used to send and request payments with anyone who has verified their phone number to an address\(or using QR codes for unverified addresses\). Send transactions make a call to the `transferWithComment` function within the `StableToken` contract.

### Comment Encryption

Comments are encrypted using the `messageEncryptionKey` of the sender and the recipient to ensure that comment contents are kept private. These encrypted comments are then stored on chain. For more details, please refer to the [Encrypted Payment Comments](../../protocol/transactions/tx-comment-encyption.md) section of protocol documentation.

### **Requesting**

Payment requests occur off chain - using a service \(firebase in the open source Celo Wallet\) we deliver payment requests. Upon confirmation of a request, a send transaction is created and sent.

### Notifications

For non-essential functionality that is not detrimental to interoperability, a private firebase service. Notifications in the Celo Wallet are one example of this. Users receive push notifications in the following circumstances:

* Receiving a payment request
* Payment of an outstanding payment request

{% hint style="info" %}
In order for notifications to work in a fork of the Celo Wallet, creation of another firebase service for the forked wallet is necessary.
{% endhint %}

## **Exchanging**

The Mobile Exchange experience implements the uniswap-style exchange detailed in [Stability Mechanism Documentation](../../protocol/stability/doto.md). For this reason, rates provided are an overestimate of the current rate and subject to change \(such changes are presented to the user if they result in a less favorable rate\)

\_\_

