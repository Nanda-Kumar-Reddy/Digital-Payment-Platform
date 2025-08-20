import { randomUUID } from 'crypto';

export function generateIdempotencyKey() {
  return randomUUID(); 
}
