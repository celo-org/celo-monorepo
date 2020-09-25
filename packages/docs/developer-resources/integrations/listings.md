# Listing Guide
If you are a digital asset exchange or ranking site, this guide will help you run a node and audit your setup. 

## Prerequisites
This guide assumes:

* You are a listing site like a digital-asset exchange (e.g. Coinbase, Binance, Kraken, etc.) or a ranking site (e.g. CMC, dAppRadar, etc.).
* You are going to be running your own Celo blockchain node (either on your own hardware or on a cloud provider infrastructure).
* You want to list CELO (previously cGLD) and cUSD on your exchange or ranking site and you want to find useful information that is relevant for listing those digital assets.
* You want to find relevant resources for brand assets that will visually aid in those listings.

## Support
If you have any questions or need assistance with these instructions, please contact cLabs or ask in the #exchanges channel on [Celo’s Discord server](https://chat.celo.org/) . Remember that Discord is a public channel: never disclose recovery phrases (also known as backup keys, or mnemonics), private keys, unsanitized log output, or personal information.

This guide will also help you find all the necessary information about brand assets, how to integrate with Celo and what useful listing information are made available to you as well as any information about looking for support.

The Celo Protocol Github is located [here.](https://github.com/celo-org/)


## Outline
In this guide you will:
* Go through an audit checklist to ensure top security requirements are met prior to running your node.
* Run a Celo blockchain network node.
* Find the relevant brand assets for the Celo protocol.
* How to integrate Celo protocol into your infrastructure.
* Learn about the name change from cGLD to CELO.
* Learn about useful API endpoints for your listing needs.
* Go over the NPM documentation for your listing needs.
* Learn about the Stability protocol and whitepaper.

## Audits
All the security audits on the smart contracts, security and economics of the Celo Platform can be found [here](https://celo.org/audits).

## Running a Celo Node
In order to get started with the Celo Platform for your listing needs, you need to be able to run a Celo full-node. This helps you audit the distributed ledger by having your own node running. The documentation on running a full-node are found [here](https://docs.celo.org/getting-started/mainnet/running-a-full-node-in-mainnet).

## Celo Brand Assets for Listing
If you are listing Celo on your exchange, you will probably need access to the Celo Platform brand assets. They can be found [here](https://celo.org/experience/brand#overview).  

Please ensure your use of the Celo Platform assets provided follows our brand policy found [here](https://celo.org/brand-policy).

## Integrating Celo With Your Infrastructure
There are several ways to integrate the Celo Platform with your infrastructure.

A general overview of integrations that would be relevant to you listing Celo Platform are shown [here](https://docs.celo.org/developer-guide/overview/integrations/general).

For more specific use-cases for exchanges, please checkout the [Custody Integration Guide](https://docs.celo.org/developer-guide/overview/integrations/custody) as well.


## Celo Native Asset and Celo Dollar

There are two important assets on the Celo network, the Celo native asset (CELO) and the Celo Dollar (cUSD). CELO was called Celo Gold (cGLD) when the contract was deployed, so you will often see references to Celo Gold in the codebase. CELO and cGLD are the same thing. You can [view the CELO implementation here](https://explorer.celo.org/address/0x8dd4f800851db9dc219fdfaeb82f8d69e2b13582/contracts)

CELO has an ERC20 interface, so users can interact with CELO via the token standard, but it is important to note that not all CELO transfers are required to go through the token contract. CELO can also be transferred by specifying the value field of a transaction, in the same way that ETH can be transferred in Ethereum. To properly monitor balance changing operations of CELO, it can be helpful to use  [Celo Rosetta.](https://github.com/celo-org/rosetta).  Celo Rosetta provides an easy way to obtain changes that are not easily queryable using the celo-blockchain RPC.

The Celo Dollar (cUSD) is implemented solely as a smart contract, so all cUSD actions are mediated by the smart contract. You can [view the implementation here.](https://explorer.celo.org/address/0xaa933baf03cfc55b8e4e0d7de479bcc12f189352/contracts)


## Address for CELO and cUSD
The smart contract address for CELO can be found [here]().
The smart contract address for cUSD can be found [here]().


## Useful API endpoints
The following are useful API endpoints available to you that would help you in your listings of the CELO and cUSD digital assets.

### CELO and cUSD
For querying the API on total coins in circulation in CELO and cUSD, the following endpoint will provide you with that:
```sh
$ curl  [https://thecelo.com/api/v0.1.js?method=ex_totalcoins](https://thecelo.com/api/v0.1.js?method=ex_totalcoins) {"code":"200","msg":"success","data":{"CELO":608485841.9959723,"cUSD":10250632.56099673}}
```

### CP-DOTO 

For API endpoints useful for listing that follow [CMC requirements](https://docs.google.com/document/d/1S4urpzUnO2t7DmS_1dc4EL4tgnnbTObPYXvDeBnukCg/edit#)

#### Summary
Summary overview.

```sh 
$ curl https://thecelo.com/api/v0.1.js?method=ex_summary

{"trading_pairs":"CELO_CUSD","last_price":2.6143,"lowest_ask":2.5933609958506225,"highest_bid":2.5676,"base_volume":37524.32000000003,"quote_volume":14714.520000000002,"price_change_percent_24h":3.7027120070382127,"highest_price_24h":2.649,"lowest_price_24h":2.4787}}
```

#### Assets

```sh
$ curl https://thecelo.com/api/v0.1.js?method=ex_assets

{"code":"200","msg":"success","data":{"CELO":{"name":"CELO","unified_cryptoasset_id":"5567","can_withdraw":"true","can_deposit":"true","min_withdraw":"0.000000000000000001","max_withdraw":"0.000000000000000001","maker_fee":"0.00","taker_fee":"0.005"},"CUSD":{"name":"Celo Dollars","unified_cryptoasset_id":"825","can_withdraw":"true","can_deposit":"true","min_withdraw":"0.000000000000000001","max_withdraw":"0.000000000000000001","maker_fee":"0.00","taker_fee":"0.005"}}}
```

#### Ticker

```sh
$ curl https://thecelo.com/api/v0.1.js?method=ex_ticker

{"code":"200","msg":"success","data":{"CELO_CUSD":{"base_id":"5567","quote_id":"825","last_price":2.6124,"quote_volume":14789.520000000002,"base_volume":37720.30000000003,"isFrozen":"0"}}}
```

#### Orderbook

```sh
$ curl https://thecelo.com/api/v0.1.js?method=ex_orderbook

{"code":"200","msg":"success","data":{"timestamp":1601061465962,"bids":[["2.5964","100"]],"asks":[["2.622606871230003","100"]]}}
```

#### CELO cUSD
```sh 
$ curl https://thecelo.com/api/v0.1.js?method=ex_celocusd

{"code":"200","msg":"success","data":{"CELO_CUSD":[{"trade_id":2697341,"timestamp":1601061491,"price":0.38238291620515147,"quote_volume":25,"base_volume":65.37948987916423,"type":"Sell"},{"trade_id":2697336,"timestamp":1601061466,"price":0.382293821845672,"quote_volume":25,"base_volume":65.39472670341044,"type":"Sell"}]}}
```


## Stability Protocol

To learn more about the Stability Mechanism, you can find it over [here](https://docs.celo.org/celo-codebase/protocol/stability). 
The  [Stability Analysis Whitepaper](https://celo.org/papers/Celo_Stability_Analysis.pdf)  and [blog post](https://medium.com/celohq/a-look-at-the-celo-stability-analysis-white-paper-part-1-23edd5ef8b5)  are also linked.

If you need more information to explore other aspects of the Celo Protocol, there’s a [useful links](https://docs.celo.org/#useful-links) page.
