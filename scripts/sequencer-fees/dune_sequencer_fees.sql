-- =============================================================================
-- Celo L2 Sequencer Fee Revenue & L1 Cost Analysis (standalone version)
-- Based on original Dune queries: 6898547, 6898180, 6898212, 6898371
-- =============================================================================
--
-- PRICING STRATEGY:
--   CELO:  prices.day (reliable - heavily traded on major exchanges)
--   USDT:  $1.00 (USD peg)
--   USDC:  $1.00 (USD peg)
--   USDm:  $1.00 (Mento USD peg)
--   EURm:  prices.day for EURm on Celo (tracks EUR/USD forex via Mento DEX)
--   ETH:   prices.day for WETH on Ethereum (reliable - top-3 asset)
--   Other: prices.day where available, 0 otherwise (negligible amounts)
--
-- Original sub-queries:
--   6898180 = chain revenue (gas_used * gas_price per fee_currency per day)
--   6898212 = L1 costs (batcher, proposer, challenger gas on Ethereum)
--   6898371 = EigenDA on-demand payment events
-- =============================================================================

WITH

-- =============================================
-- 1. CHAIN REVENUE (from query_6898180)
-- =============================================
txs AS (
    SELECT
        date_trunc('day', block_time) AS day,
        coalesce(token, fee_currency, 0x471EcE3750Da237f93B8E339c536989b8978a438) AS fee_currency,
        gas_used * gas_price / coalesce(decimals_diff, 1) AS tx_fee
    FROM celo.transactions tx
        JOIN (
            SELECT number AS block_number, base_fee_per_gas
            FROM celo.blocks
        ) USING (block_number)
        LEFT JOIN (
            SELECT 0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72 AS fee_currency,
                   0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e AS token,
                   1e12 AS decimals_diff
            UNION ALL
            SELECT 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B AS fee_currency,
                   0xcebA9300f2b948710d2653dD7B07f33A8B32118C AS token,
                   1e12 AS decimals_diff
        ) fee_currency_adapter USING (fee_currency)
    WHERE block_number >= 31056500
),

daily_fee_values AS (
    SELECT day, fee_currency, SUM(tx_fee) AS tx_fee
    FROM txs
    GROUP BY day, fee_currency
),

daily_fee_priced AS (
    SELECT
        day,
        symbol,
        tx_fee / power(10, decimals) AS tx_fee_token,
        price AS token_price_USD
    FROM daily_fee_values
    LEFT JOIN prices.day
        ON fee_currency = contract_address
        AND blockchain = 'celo'
        AND daily_fee_values.day = prices.day.timestamp
),

chain_revenue AS (
    SELECT
        day,
        SUM(CASE WHEN symbol = 'CELO'  THEN tx_fee_token ELSE 0 END) AS fee_CELO,
        SUM(CASE WHEN symbol = 'USD₮'  THEN tx_fee_token ELSE 0 END) AS fee_USDT,
        SUM(CASE WHEN symbol = 'USDm'  THEN tx_fee_token ELSE 0 END) AS fee_USDm,
        SUM(CASE WHEN symbol = 'EURm'  THEN tx_fee_token ELSE 0 END) AS fee_EURm,
        SUM(CASE WHEN symbol = 'USDC'  THEN tx_fee_token ELSE 0 END) AS fee_USDC,

        SUM(CASE WHEN symbol = 'CELO'  THEN tx_fee_token * token_price_USD ELSE 0 END) AS fee_CELO_usd,
        SUM(CASE WHEN symbol = 'USD₮'  THEN tx_fee_token * 1.00 ELSE 0 END) AS fee_USDT_usd,
        SUM(CASE WHEN symbol = 'USDm'  THEN tx_fee_token * 1.00 ELSE 0 END) AS fee_USDm_usd,
        SUM(CASE WHEN symbol = 'EURm'  THEN tx_fee_token * token_price_USD ELSE 0 END) AS fee_EURm_usd,
        SUM(CASE WHEN symbol = 'USDC'  THEN tx_fee_token * 1.00 ELSE 0 END) AS fee_USDC_usd,
        SUM(CASE WHEN symbol NOT IN ('CELO', 'USD₮', 'USDm', 'EURm', 'USDC')
                 THEN tx_fee_token * token_price_USD ELSE 0 END) AS others_usd
    FROM daily_fee_priced
    GROUP BY day
),

-- =============================================
-- 2. L1 COSTS (from query_6898212)
-- =============================================
l1_txs AS (
    SELECT
        service,
        gas_used * gas_price / 1e18 AS cost_eth,
        date_trunc('day', block_time) AS day
    FROM ethereum.transactions
        JOIN (
            SELECT 'batcher'    AS service, 0x0cd08c7f7a96aa9635f761b49216b9ea74c5ca60 AS "from"
            UNION ALL
            SELECT 'proposer',              0x1204884e697efd929729b9a717ea14496298a689
            UNION ALL
            SELECT 'proposer',              0x79d14553d6b3484f5612272b43c219a882415d33
            UNION ALL
            SELECT 'challenger',            0x6b145ebf66602ec524b196426b46631259689583
        ) USING ("from")
    WHERE block_number >= 22128103
),

l1_costs AS (
    SELECT
        day,
        SUM(CASE WHEN service = 'batcher'    THEN cost_eth ELSE 0 END) AS batcher_cost_eth,
        SUM(CASE WHEN service = 'proposer'   THEN cost_eth ELSE 0 END) AS proposer_cost_eth,
        SUM(CASE WHEN service = 'challenger' THEN cost_eth ELSE 0 END) AS challenger_cost_eth
    FROM l1_txs
    GROUP BY day
),

-- =============================================
-- 3. EIGENDA COSTS (from query_6898371)
-- =============================================
eigenda_costs AS (
    SELECT
        block_date AS day,
        bytearray_to_uint256(bytearray_substring(l.data, 23, 10)) / 1e18 AS EigenDA_cost_eth
    FROM ethereum.logs l
    WHERE l.contract_address = 0xb2e7ef419a2A399472ae22ef5cFcCb8bE97A4B05
      AND l.topic0 = 0x6fbb447a2c09b8901d70b0d5b9fbce159ee8fda4460e5af2570cab3fe0adf268
      AND l.topic1 = 0x000000000000000000000000ecf08b0a4f196e06e9aece95d5dd724bc121f09c
),

-- =============================================
-- 4. ETH PRICE
-- =============================================
eth_price AS (
    SELECT
        timestamp AS day,
        price AS eth_price_usd
    FROM prices.day
    WHERE blockchain = 'ethereum'
      AND contract_address = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
)

-- =============================================
-- 5. FINAL OUTPUT
-- =============================================
SELECT
    r.day,
    r.fee_CELO, r.fee_USDT, r.fee_USDm, r.fee_EURm, r.fee_USDC,
    r.fee_CELO_usd, r.fee_USDT_usd, r.fee_USDm_usd, r.fee_EURm_usd, r.fee_USDC_usd,
    r.others_usd,
    COALESCE(c.batcher_cost_eth, 0)    AS batcher_cost_eth,
    COALESCE(c.proposer_cost_eth, 0)   AS proposer_cost_eth,
    COALESCE(c.challenger_cost_eth, 0) AS challenger_cost_eth,
    COALESCE(e.EigenDA_cost_eth, 0)    AS EigenDA_cost_eth,
    COALESCE(p.eth_price_usd, 0)       AS eth_price_usd
FROM chain_revenue r
LEFT JOIN l1_costs c      ON r.day = c.day
LEFT JOIN eigenda_costs e ON r.day = e.day
LEFT JOIN eth_price p     ON r.day = p.day
ORDER BY r.day
