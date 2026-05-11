/**
 * Generates a unique, shareable referral code.
 * Uses a 24-character uppercase alphabet (consonants + numbers)
 * excluding confusing characters (I, O, 0, 1).
 * Produces an 8-character code.
 */

const ALPHABET = "BCDFGHJKLMNPQRSTVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_ATTEMPTS = 3;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    code += ALPHABET[randomIndex];
  }
  return code;
}

/**
 * Generate a unique referral code, retrying on collision.
 * Returns the generated code.
 */
export async function generateReferralCode(
  checkExists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();
    const exists = await checkExists(code);
    if (!exists) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique referral code after 3 attempts");
}
