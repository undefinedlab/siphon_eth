use tfhe::integer::{RadixCiphertext, ServerKey};

const NUM_BLOCKS: usize = 16;

/// Performs a homomorphic comparison and returns an encrypted integer (1 for true, 0 for false).
pub fn homomorphic_check(
    sks: &ServerKey,
    encrypted_trigger_price: &RadixCiphertext,
    condition: &str,
    current_price_u32: u32,
) -> RadixCiphertext {
    let encrypted_bool_result = match condition {
        // "GTE": The user wants to know if `current_price >= trigger_price`..
        "GTE" => sks.scalar_le_parallelized(encrypted_trigger_price, current_price_u32 as u64),

        // "LTE": The user wants to know if `current_price <= trigger_price`..
        "LTE" => sks.scalar_ge_parallelized(encrypted_trigger_price, current_price_u32 as u64),

        _ => panic!("Invalid condition: {}", condition),
    };

    sks.if_then_else_parallelized(
        &encrypted_bool_result,
        &sks.create_trivial_radix(1, NUM_BLOCKS), // If true, return encrypted 1
        &sks.create_trivial_radix(0, NUM_BLOCKS), // If false, return encrypted 0
    )
}

pub fn homomorphic_or(
    sks: &ServerKey,
    a: &RadixCiphertext,
    b: &RadixCiphertext,
) -> RadixCiphertext {
    sks.bitor_parallelized(a, b)
}
