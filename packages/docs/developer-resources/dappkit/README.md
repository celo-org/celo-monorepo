# Celo dAppKit

dAppKit is a lightweight set of functions that allow mobile dApps to work with the Celo Wallet to sign transactions and access the user's account. This allows for a better user experience: dApps can focus on a great native experience without having to worry about key management. It also provides a simpler development experience, as no state or connection management is necessary.

dAppKit supports the following functionality:

- Request permission to access account information and phone number from the Celo Wallet
- Request permission to sign transaction(s) from the Celo Wallet
- Look up phone numbers using the [Identity Protocol](../../celo-codebase/protocol/identity/README.md) to find contacts using Celo.

dAppKit is currently built with the excellent [Expo framework](https://expo.io) in mind. In the near future, we will make it more generic to all of React Native and possibly native stacks, but for now you get to take advantage of some awesome features like an incredibly easy setup, hot-reloading, and more.

{% page-ref page="setup.md" %}

{% page-ref page="examples.md" %}
