# Celo DAppKit

DAppKit is a lightweight set of functions that allow mobile DApps to use the celo light client bundled with the Celo Wallet to sign transactions and access the user's address. This allows for a less resource-intensive experience for the user (only one client needs to run on the phone) and an easier experience for development, as no light client state/connection management is necessary.

DAppKit supports the following functionality:

- Request permission to access account information and phone number from the Celo Wallet
- Request permission to sign transaction(s) from the Celo Waller
- Look up phone numbers using the [Identity Protocol](../../celo-codebase/protocol/identity/README.md) to find contacts using Celo.

{% page-ref page="setup.md" %}

{% page-ref page="examples.md" %}
