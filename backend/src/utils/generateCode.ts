import { customAlphabet } from 'nanoid';

// Alfabeto seguro para URLs sem caracteres ambíguos (sem l, 1, I, O, 0)
const alphabet = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 8);

export function generateCode(): string {
  return nanoid();
}
