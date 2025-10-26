## 🧠Why did we choose Pyth Network?

Our system depends on accurate, low-latency market data to perform encrypted computations and price-sensitive logic inside our FHE (Fully Homomorphic Encryption) engine.
To achieve that, we integrated Pyth Network, which provides high-frequency, verifiable price feeds natively across EVM chains through its pull-based oracle model.

Unlike traditional push oracles, Pyth’s Pull model gives us direct control over when and how prices are updated — crucial for privacy-preserving systems where computation timing and data access must be deterministic.
By fetching price updates on demand, our nodes and relayers can ensure that encrypted valuation, matching, and frontend calculations always use the freshest and most verifiable price data — without relying on third-party RPC feeds or stale off-chain sources.

## Implementation
🔹 Pull-Based Price Integration

Our integration follows Pyth’s recommended pull method, in which our backend securely fetches signed prices from Hermes, then updates them on-chain before consumption.

Workflow:

Pull price data from Hermes
Using Pyth’s Hermes API, we fetch the latest signed price update (VAA message) for any market pair.

const priceUpdateData = await fetchFromHermes("ETH/USD");


## Hermes endpoint reference:
https://hermes.pyth.network/

Update prices on-chain
Once the signed VAA is fetched, we call the updatePriceFeeds() function on our target EVM chain.
This ensures that the contract has the most recent verified data directly from Pyth’s publisher network.

await pythContract.updatePriceFeeds(priceUpdateData);


## Consume the price
After updating, the price is ready to be consumed by our FHE engine and frontend logic.
The engine calls:

const { price, confidence } = await pythContract.getPrice("ETH/USD");
fheEngine.updateMarket(fhe.encrypt(price));


Inside the FHE pipeline, these prices are encrypted and combined with user order data to perform valuation and matching without exposing private information.

(Optional) Run a Price Pusher
For traditional oracle-style updates, we can run a lightweight price pusher service that automates Hermes fetches and on-chain updates at fixed intervals.
This is useful for maintaining continuous price freshness on all supported chains.

### 🔹 Frontend Integration

On the frontend, we use the same Pyth pull-based logic for live display and user-side validation.

usePythPrice(symbol) hook continuously fetches from Hermes and ensures price consistency with on-chain updates.

UI components (like tickers, order forms, and charts) always display verified data.

**References:**

src/hooks/usePythPrice.ts

src/components/swap_face/elements/PriceTicker.tsx

Example:

const { price, confidence } = usePythPrice("BTC/USD");
return <span>BTC/USD: ${price.toFixed(2)}</span>;

### 🔹 Guide & Resources

For full implementation details, follow the official Pyth EVM Integration Guide —
it walks through setting up Hermes, calling updatePriceFeeds(), and consuming prices in under five minutes:

**📘 Pyth EVM Integration Guide:**
https://docs.pyth.network/
