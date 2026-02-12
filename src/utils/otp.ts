import crypto from "crypto";

/**
 * Generate a 6-digit OTP using cryptographically secure randomness
 */
export const generateOtp = (): string => {
    // Generate 3 random bytes → 24 bits → range 0-16777215
    const buffer = crypto.randomBytes(3);
    // Mod 1_000_000 to get 6-digit number
    const number = buffer.readUIntBE(0, 3) % 1000000;

    // Pad with leading zeros if needed
    return number.toString().padStart(6, "0");
};
