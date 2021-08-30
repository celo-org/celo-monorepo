# Listings

Welcome to the Listing Guide documentation page. If you are a digital asset exchange or ranking site, this guide will help you run a node and audit your setup.

## Support

If you have any questions or need assistance with these instructions, please contact cLabs or ask in the \#exchanges channel on [Celo’s Discord server](https://chat.celo.org/). Remember that Discord is a public channel: never disclose recovery phrases \(also known as backup keys, or mnemonics\), private keys, unsanitized log output, or personal information.

This guide will also help you find all the necessary information about brand assets, how to integrate with Celo and what useful listing information are made available to you as well as any information about looking for support.

## Celo Brand Assets for Listing

If you are listing Celo on your exchange, you will probably need access to the Celo Platform brand assets. They can be found [here](https://celo.org/experience/brand#overview).

Please ensure your use of the Celo Platform assets provided follows the brand policy found [here](https://celo.org/brand-policy).

## How To's

### Integrating Celo With Your Infrastructure

There are several ways to integrate the Celo Platform with your infrastructure.

A general overview of integrations that would be relevant to you listing Celo Platform are shown [here](https://docs.celo.org/developer-guide/integrations/general).

For more specific use-cases for exchanges, please checkout the [Custody and Exchange Integration Guide](https://docs.celo.org/developer-guide/integrations/custody) as well.

## Important Information

### Celo Native Asset and Stable Value Currencies

There are key assets on the Celo network, the Celo native asset \(CELO\) and Celo-powered Stable Value Currencies, such as Celo Dollar \(cUSD\) and Celo Euro \(cEUR\). CELO was formerly called Celo Gold \(cGLD\) when the contract was deployed, so you will often see references to Celo Gold and CGLD in the codebase. To learn more about the two, please read [this](https://docs.celo.org/developer-guide/celo-for-eth-devs#the-celo-native-asset-and-the-celo-dollar) section of the docs.

You can also view the CGP proposal regarding the name change [here](https://github.com/celo-org/celo-proposals/blob/master/CGPs/0003.md) and the forum post about the name change [here](https://forum.celo.org/t/proposal-to-rename-celo-gold-to-celo-native-asset/528).

## Resources

### Address for CELO and Stable Value Currencies

* CELO \($CELO\) - [`0x471ece3750da237f93b8e339c536989b8978a438`](https://explorer.celo.org/address/0x471ece3750da237f93b8e339c536989b8978a438/transactions)
* Celo Dollar \($cUSD\) - [`0x765de816845861e75a25fca122bb6898b8b1282a`](https://explorer.celo.org/address/0x765de816845861e75a25fca122bb6898b8b1282a/transactions)
* Celo Euro \($cEUR\) - [`0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73`](https://explorer.celo.org/address/0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73/transactions)

### Useful API endpoints

The following are useful API endpoints available to you that would help you in your listings of the CELO and cUSD digital assets.

#### CELO and Stable Value Currencies

**Total CELO supply**

For querying the API on total coins in circulation in CELO, which are the total amount of coins in existence right now, the following endpoint will provide you with that:

```bash
$ curl  [https://thecelo.com/api/v0.1.js?method=ex_totalcoins](https://thecelo.com/api/v0.1.js?method=ex_totalcoins) {"code":"200","msg":"success","data":{"CELO":608485841.9959723,"cUSD":10250632.56099673}}
```

**Stable Value Currencies**

**cUSD Circulating Supply**

Circulating Supply refers to the \# of coins that are circulating in the market and in the general public's hands.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_cusd_circulating
11353464.550486518
```

**cEUR Circulating Supply**

This endpoint is not yet available.

#### CP-DOTO \(Stability Algorithm\)

CP-DOTO information can be found [here](https://docs.celo.org/celo-codebase/protocol/stability/doto).

For API endpoints useful for listing that follow [CMC requirements](https://docs.google.com/document/d/1S4urpzUnO2t7DmS_1dc4EL4tgnnbTObPYXvDeBnukCg/edit#)

**Mento Addresses**

* cUSD/CELO contract - [`0x67316300f17f063085Ca8bCa4bd3f7a5a3C66275`](https://explorer.celo.org/address/0x67316300f17f063085Ca8bCa4bd3f7a5a3C66275/transactions)
* cEUR/CELO contract - [`0xE383394B913d7302c49F794C7d3243c429d53D1d`](https://explorer.celo.org/address/0xE383394B913d7302c49F794C7d3243c429d53D1d/transactions)

**Summary**

Summary overview of market data for all tickers and all markets. These endpoints don't yet support cEUR.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_summary

{"trading_pairs":"CELO_CUSD","last_price":2.6143,"lowest_ask":2.5933609958506225,"highest_bid":2.5676,"base_volume":37524.32000000003,"quote_volume":14714.520000000002,"price_change_percent_24h":3.7027120070382127,"highest_price_24h":2.649,"lowest_price_24h":2.4787}}
```

**Assets**

In depth details of the assets available on the exchange.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_assets

{"code":"200","msg":"success","data":{"CELO":{"name":"CELO","unified_cryptoasset_id":"5567","can_withdraw":"true","can_deposit":"true","min_withdraw":"0.000000000000000001","max_withdraw":"0.000000000000000001","maker_fee":"0.00","taker_fee":"0.005"},"CUSD":{"name":"Celo Dollars","unified_cryptoasset_id":"825","can_withdraw":"true","can_deposit":"true","min_withdraw":"0.000000000000000001","max_withdraw":"0.000000000000000001","maker_fee":"0.00","taker_fee":"0.005"}}}
```

**Ticker**

24-hour rolling window price change statistics.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_ticker

{"code":"200","msg":"success","data":{"CELO_CUSD":{"base_id":"5567","quote_id":"825","last_price":2.6124,"quote_volume":14789.520000000002,"base_volume":37720.30000000003,"isFrozen":"0"}}}
```

**Orderbook**

Market depth of a trading pair. One array containing a list of ask prices and another array containing bid prices.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_orderbook

{"code":"200","msg":"success","data":{"timestamp":1601061465962,"bids":[["2.5964","100"]],"asks":[["2.622606871230003","100"]]}}
```

**CELO cUSD**

Recently completed \(past 24h\) trades.

```bash
$ curl https://thecelo.com/api/v0.1.js?method=ex_celocusd

{"code":"200","msg":"success","data":{"CELO_CUSD":[{"trade_id":2697341,"timestamp":1601061491,"price":0.38238291620515147,"quote_volume":25,"base_volume":65.37948987916423,"type":"Sell"},{"trade_id":2697336,"timestamp":1601061466,"price":0.382293821845672,"quote_volume":25,"base_volume":65.39472670341044,"type":"Sell"}]}}
```

### Whitepapers

To learn about the Celo Protocol, please refer to the [whitepaper](https://celo.org/papers/Celo_A_Multi_Asset_Cryptographic_Protocol_for_Decentralized_Social_Payments.pdf).

If you need more information to explore other aspects of the Celo Protocol, there’s a [useful links](https://docs.celo.org/#useful-links) page.

To learn more about the Stability Mechanism, you can find it over [here](https://docs.celo.org/celo-codebase/protocol/stability). The [Stability Analysis Whitepaper](https://celo.org/papers/Celo_Stability_Analysis.pdf) and [blog post](https://medium.com/celohq/a-look-at-the-celo-stability-analysis-white-paper-part-1-23edd5ef8b5) will provide a lot more information on the stability algorithm.

If you want to find more information about the Celo Reserve, a diversified portfolio of cryptocurrencies supporting the ability of the Celo protocol to expand and contract the supply of Celo stable assets, please visit [https://celoreserve.org](https://celoreserve.org%20).

### Github

The Celo Protocol GitHub is located [here.](https://github.com/celo-org/)

### Audits

All the security audits on the smart contracts, security and economics of the Celo Platform can be found [here](https://celo.org/audits).

