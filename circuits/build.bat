@echo off
REM Siphon ZK Circuit Build Script for Windows
REM This script compiles circuits, generates keys, and exports verifier

setlocal enabledelayedexpansion

echo 🔧 Building Siphon ZK Circuits...

REM Check if circom is installed
circom --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Circom is not installed. Please install it first:
    echo npm install -g circom
    exit /b 1
)

REM Check if snarkjs is installed
snarkjs --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Snarkjs is not installed. Please install it first:
    echo npm install -g snarkjs
    exit /b 1
)

REM Create build directory
if not exist build mkdir build
cd build

echo [INFO] Compiling circuits...

REM Compile main withdrawal circuit
echo [INFO] Compiling withdraw.circom...
circom ..\circuits\withdraw.circom --r1cs --wasm --sym --c
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile withdraw circuit
    exit /b 1
)
echo [SUCCESS] Withdraw circuit compiled successfully

REM Compile helper circuits
echo [INFO] Compiling poseidon.circom...
circom ..\circuits\lib\poseidon.circom --r1cs --wasm --sym --c
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile poseidon circuit
    exit /b 1
)
echo [SUCCESS] Poseidon circuit compiled successfully

echo [INFO] Compiling merkleTree.circom...
circom ..\circuits\lib\merkleTree.circom --r1cs --wasm --sym --c
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile merkle tree circuit
    exit /b 1
)
echo [SUCCESS] Merkle tree circuit compiled successfully

REM Check if Powers of Tau file exists
if not exist pot14_final.ptau (
    echo [WARNING] Powers of Tau file not found. Generating...
    
    REM Generate Powers of Tau
    echo [INFO] Generating Powers of Tau...
    snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
    
    echo [INFO] Contributing to Powers of Tau...
    snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="Siphon contribution" -v
    
    echo [INFO] Preparing phase 2...
    snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
    
    echo [SUCCESS] Powers of Tau generated
) else (
    echo [SUCCESS] Powers of Tau file found
)

REM Generate proving and verification keys
echo [INFO] Generating proving and verification keys...
snarkjs groth16 setup withdraw.r1cs pot14_final.ptau withdraw_0000.zkey

echo [INFO] Contributing to trusted setup...
snarkjs zkey contribute withdraw_0000.zkey withdraw_0001.zkey --name="Siphon trusted setup" -v

echo [INFO] Exporting verification key...
snarkjs zkey export verificationkey withdraw_0001.zkey verification_key.json

echo [INFO] Exporting Solidity verifier...
snarkjs zkey export solidityverifier withdraw_0001.zkey verifier.sol

REM Copy verifier to contracts directory
copy verifier.sol ..\contracts\Verifier.sol
echo [SUCCESS] Verifier contract copied to contracts directory

REM Generate test proof if requested
if "%1"=="--test-proof" (
    echo [INFO] Generating test proof...
    
    REM Create test input
    echo {> input.json
    echo     "secret": "123456789",>> input.json
    echo     "nullifier": "987654321",>> input.json
    echo     "pathElements": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],>> input.json
    echo     "pathIndices": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],>> input.json
    echo     "root": "0",>> input.json
    echo     "nullifierHash": "0",>> input.json
    echo     "recipient": "1234567890123456789012345678901234567890",>> input.json
    echo     "fee": "1000000000000000">> input.json
    echo }>> input.json
    
    REM Generate witness
    node withdraw_js\generate_witness.js withdraw_js\withdraw.wasm input.json witness.wtns
    
    REM Generate proof
    snarkjs groth16 prove withdraw_0001.zkey witness.wtns proof.json public.json
    
    REM Verify proof
    snarkjs groth16 verify verification_key.json public.json proof.json
    
    echo [SUCCESS] Test proof generated and verified
)

echo [SUCCESS] Build completed successfully!
echo [INFO] Generated files:
echo   - withdraw.r1cs (R1CS constraint system)
echo   - withdraw.wasm (WASM witness generator)
echo   - withdraw_0001.zkey (Proving key)
echo   - verification_key.json (Verification key)
echo   - verifier.sol (Solidity verifier contract)
echo   - proof.json (Test proof)
echo   - public.json (Public inputs)

cd ..
echo [SUCCESS] ZK circuits build complete! 🎉
