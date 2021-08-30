# DAppKit

DAppKit is a lightweight set of functions that allow mobile DApps to work with the Celo Wallet to sign transactions and access the user's account. This allows for a better user experience: DApps can focus on a great native experience without having to worry about key management. It also provides a simpler development experience, as no state or connection management is necessary.

DAppKit supports the following functionality:

* Request permission to access account information and phone number from the Celo Wallet
* Request permission to sign transaction\(s\) from the Celo Wallet
* Look up phone numbers using the [Identity Protocol](../../celo-codebase/protocol/identity/) to find contacts using Celo.

DAppKit is currently built with React Native in mind, though the excellent [Expo framework](https://expo.io) is still highly recommended for developers building mobile and web DApps on Celo. Expo offers awesome features like incredibly easy setup, hot-reloading, and more. Currently, most of our tutorials and examples involve Expo, though we are working on creating additional documentation for other app frameworks. While DAppKit was designed for mobile apps in particular, since version `1.1.0-beta.1` it offers beta support for web DApps running in the browser of a mobile device. More details about this are included in the `Usage` section below.

{% page-ref page="setup.md" %}

{% page-ref page="usage.md" %}

