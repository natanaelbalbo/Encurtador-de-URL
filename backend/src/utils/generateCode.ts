import { customAlphabet } from 'nanoid';

// URL-safe alphabet without ambiguous characters (no l, 1, I, O, 0)
const alphabet = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 8);

export function generateCode(): string {
  return nanoid();
}
