import argon2 from 'argon2';

export async function hashPIN(pin) {
  return argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.PIN_HASH_MEMORY || 65536),
    timeCost: Number(process.env.PIN_HASH_TIME || 3),
    parallelism: Number(process.env.PIN_HASH_PARALLELISM || 1)
  });
}
