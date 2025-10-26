## 🧠Why did we choose Pyth Network?
To power our Fully Homomorphic Encryption (FHE) engine, we need market data that is both fast and trustworthy. We've integrated the Pyth Network for its high-frequency, verifiable price feeds. Critically, we use Pyth's pull model to control exactly when we update prices. This on-demand access is key to ensuring that our encrypted system's calculations are always based on the most current and auditable prices available.

## 🖥️ Frontend Integration

- On the frontend, we use the same Pyth pull-based logic for live display and user-side validation.
fetchPrices() hook continuously fetches from Hermes and ensures price consistency with on-chain updates.
UI components (like tickers, order forms, and charts) always display verified data.
```
const response = await fetch(
  `https://hermes.pyth.network/v2/updates/price/latest?${idsParam}`
);
```
**References:**
[src/components/swap_face/elements/ProSwapMode](https://github.com/undefinedlab/siphon_eth/blob/master/src/components/swap_face/ProSwapMode.tsx#L57)


## 🏦 Backend Integration
### 1. Pull price data from Hermes
- Our integration follows Pyth’s [Hermes](https://hermes.pyth.network/) API [pull](https://github.com/undefinedlab/siphon_eth/blob/master/packages/trade-executor/oracle.py#L9) method, in which our backend securely fetches signed prices from Hermes, then updates them off-chain before consumption. Using Pyth’s Hermes API, we fetch the latest signed price update (VAA message) for any market pair.
```
url = f"{PYTH_HERMES_URL}/api/latest_price_feeds?{ids_query}"
```
### 2. Transfer price data to FHE Engine
- Once the price is fetched, we [transfer](https://github.com/undefinedlab/siphon_eth/blob/master/packages/trade-executor/scheduler.py#L26-L41) the real-time price to FHE engine for price matching check

### 3. Homomorphic Price Matching
- Inside the FHE pipeline, these prices are encrypted and combined with user order data to perform valuation and [matching](https://github.com/undefinedlab/siphon_eth/blob/master/packages/fhe/src/fhe_engine/core.rs#L6-L27) without exposing private information.
```
let encrypted_bool_result = match condition {
    // "GTE": The user wants to know if `current_price >= trigger_price`..
    "GTE" => sks.scalar_le_parallelized(encrypted_trigger_price, current_price_u32 as u64),

    // "LTE": The user wants to know if `current_price <= trigger_price`..
    "LTE" => sks.scalar_ge_parallelized(encrypted_trigger_price, current_price_u32 as u64),
};
```

## 🔹 Guide & Resources

For full implementation details, follow the official Pyth EVM Integration Guide —
it walks through setting up Hermes, calling updatePriceFeeds(), and consuming prices in under five minutes:

**📘 Pyth EVM Integration Guide:**
https://docs.pyth.network/
