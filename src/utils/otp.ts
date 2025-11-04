import crypto from 'crypto'

export const generateOtp = () : string => {
    const buffer = crypto.randomBytes(3);
    const number = buffer.readUIntBE(0, 3) % 1000000;
    return number.toString().padStart(6, '0');
};
