# X-Ray

Web dashboard for inspecting Celo OP Stack contract versions, ownership, and state.

**Live**: https://x-ray-celo.vercel.app/

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

No build step — pure static files.

## Supported networks

| Network      | Source                                |
| ------------ | ------------------------------------- |
| Celo Mainnet | Ethereum mainnet L1 contracts         |
| Celo Sepolia | Ethereum Sepolia L1 contracts         |
| Chaos        | Internal testnet L1 contracts         |
| Localhost    | Anvil fork on `http://127.0.0.1:8545` |

## Deploy to Vercel

```bash
vercel --prod
```

Configured in `vercel.json` — static SPA with JS content-type headers.
