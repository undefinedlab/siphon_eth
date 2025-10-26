use tfhe::integer::{gen_keys_radix, RadixCiphertext, RadixClientKey, ServerKey};
use tfhe::shortint::parameters::PARAM_MESSAGE_2_CARRY_2_KS_PBS;

const NUM_BLOCKS: usize = 16;

pub fn generate_fhe_keys() -> (RadixClientKey, ServerKey) {
    // Generates the cryptographic keys for FHE operations.
    gen_keys_radix(PARAM_MESSAGE_2_CARRY_2_KS_PBS, NUM_BLOCKS)
}

pub fn encrypt_price(price_u32: u32, cks: &RadixClientKey) -> RadixCiphertext {
    // Encrypts the integer price (which holds price * 100)
    cks.encrypt(price_u32 as u64)
}
