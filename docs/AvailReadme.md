## Why did we choose Avail Nexus SDK?
Our model acts as a privacy vault and asset relayer, allowing users to securely and anonymously exchange any asset they hold in the EVM environment with the rest of the world.

To make that experience seamless, we integrated Avail’s Nexus SDK. It’s essentially the front gate of our multi-chain layer — giving us unified balances, native bridging, and cross-chain execution without the usual patchwork of contracts and RPC calls.

With Nexus, a user’s entire EVM portfolio is consolidated into one balance view. Behind the scenes, the SDK handles balance aggregation across networks, so users don’t have to switch chains or manage multiple wallets. It also powers our bridge-and-execute flow, which means assets can move and act across chains in one smooth transaction.

## Implementation

### Unified Balance
We provide a complete visualization of assets across all EVM-chains under user's account using `getUnifiedBalance()`:
https://github.com/undefinedlab/siphon_eth/blob/master/src/lib/nexus.ts#L37
https://github.com/undefinedlab/siphon_eth/blob/master/src/components/swap_face/elements/UnifiedBalanceDisplay.tsx#L23

### Bridging & Execution
Bridging the asset into a single chain is a crucial feature of our model. 
We utilize `bridge()` to gather funds from users' chains into a single chain where our contract resides.
- https://github.com/undefinedlab/siphon_eth/blob/master/src/lib/handler.ts#L62

Once bridging transaction is completed successfully, we utilize `execute()` to execute `deposit` function, which will safely transfer the bridged funds to our relayer contract.
- https://github.com/undefinedlab/siphon_eth/blob/master/src/lib/handler.ts#L74
- https://github.com/undefinedlab/siphon_eth/blob/master/src/lib/handler.ts#L152