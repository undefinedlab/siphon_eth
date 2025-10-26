## 🧠 Why did we choose Hardhat?
We choose Hardhat because it provides a complete and flexible JavaScript/TypeScript development environment for Ethereum.
Its built-in Hardhat Network enables rapid, isolated testing and detailed debugging with Solidity stack traces.

Most importantly, we rely on **Hardhat Ignition**, a declarative deployment system.
Ignition guaranteed reliable deployments by automatically managing complex dependencies, handling network errors, and allowing us to resume interrupted setups instantly, eliminating deployment complexity and boilerplate code.

## 🚀 Deployment
Hardhat Ignition was immensely useful because it enforced declarative, idempotent deployment, which is vital for our large size deployment. 
Its journal mechanism eliminated wasted time by letting us instantly resume complex, multi-step deployments after network failures, instead of restarting.
This single feature guaranteed the integrity of our contract setup while drastically accelerating our entire development timeline.
- Deployment Script: https://github.com/undefinedlab/siphon_eth/blob/master/packages/contracts/ignition/modules/Deploy.ts

## ✅ Test Network & Testing
Hardhat made testing easy by providing a fast, isolated sandbox. 
The integrated Hardhat Network delivered instant transactions and deterministic test states.
Furthermore, its crucial Solidity stack traces and console.log integration allowed us to rapidly write, run, and debug our contract logic with unprecedented clarity.
- Test Script: https://github.com/undefinedlab/siphon_eth/blob/master/packages/contracts/test/deployment.test.ts

## 👷Guide & Resources
- https://hardhat.org/ignition/docs/getting-started
