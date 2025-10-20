#!/bin/bash

# Siphon ZK Circuit Build Script
# This script compiles circuits, generates keys, and exports verifier

set -e

echo "🔧 Building Siphon ZK Circuits..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    print_error "Circom is not installed. Please install it first:"
    echo "npm install -g circom"
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    print_error "Snarkjs is not installed. Please install it first:"
    echo "npm install -g snarkjs"
    exit 1
fi

# Create build directory
mkdir -p build
cd build

print_status "Compiling circuits..."

# Compile main withdrawal circuit
print_status "Compiling withdraw.circom..."
circom ../circuits/withdraw.circom --r1cs --wasm --sym --c
if [ $? -eq 0 ]; then
    print_success "Withdraw circuit compiled successfully"
else
    print_error "Failed to compile withdraw circuit"
    exit 1
fi

# Compile helper circuits
print_status "Compiling poseidon.circom..."
circom ../circuits/lib/poseidon.circom --r1cs --wasm --sym --c
if [ $? -eq 0 ]; then
    print_success "Poseidon circuit compiled successfully"
else
    print_error "Failed to compile poseidon circuit"
    exit 1
fi

print_status "Compiling merkleTree.circom..."
circom ../circuits/lib/merkleTree.circom --r1cs --wasm --sym --c
if [ $? -eq 0 ]; then
    print_success "Merkle tree circuit compiled successfully"
else
    print_error "Failed to compile merkle tree circuit"
    exit 1
fi

# Check if Powers of Tau file exists
if [ ! -f "pot14_final.ptau" ]; then
    print_warning "Powers of Tau file not found. Generating..."
    
    # Generate Powers of Tau
    print_status "Generating Powers of Tau..."
    snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
    
    print_status "Contributing to Powers of Tau..."
    snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="Siphon contribution" -v
    
    print_status "Preparing phase 2..."
    snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
    
    print_success "Powers of Tau generated"
else
    print_success "Powers of Tau file found"
fi

# Generate proving and verification keys
print_status "Generating proving and verification keys..."
snarkjs groth16 setup withdraw.r1cs pot14_final.ptau withdraw_0000.zkey

print_status "Contributing to trusted setup..."
snarkjs zkey contribute withdraw_0000.zkey withdraw_0001.zkey --name="Siphon trusted setup" -v

print_status "Exporting verification key..."
snarkjs zkey export verificationkey withdraw_0001.zkey verification_key.json

print_status "Exporting Solidity verifier..."
snarkjs zkey export solidityverifier withdraw_0001.zkey verifier.sol

# Copy verifier to contracts directory
cp verifier.sol ../contracts/Verifier.sol
print_success "Verifier contract copied to contracts directory"

# Generate test proof (optional)
if [ "$1" = "--test-proof" ]; then
    print_status "Generating test proof..."
    
    # Create test input
    cat > input.json << EOF
{
    "secret": "123456789",
    "nullifier": "987654321",
    "pathElements": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
    "pathIndices": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
    "root": "0",
    "nullifierHash": "0",
    "recipient": "1234567890123456789012345678901234567890",
    "fee": "1000000000000000"
}
EOF
    
    # Generate witness
    node withdraw_js/generate_witness.js withdraw_js/withdraw.wasm input.json witness.wtns
    
    # Generate proof
    snarkjs groth16 prove withdraw_0001.zkey witness.wtns proof.json public.json
    
    # Verify proof
    snarkjs groth16 verify verification_key.json public.json proof.json
    
    print_success "Test proof generated and verified"
fi

print_success "Build completed successfully!"
print_status "Generated files:"
echo "  - withdraw.r1cs (R1CS constraint system)"
echo "  - withdraw.wasm (WASM witness generator)"
echo "  - withdraw_0001.zkey (Proving key)"
echo "  - verification_key.json (Verification key)"
echo "  - verifier.sol (Solidity verifier contract)"
echo "  - proof.json (Test proof)"
echo "  - public.json (Public inputs)"

cd ..
print_success "ZK circuits build complete! 🎉"
