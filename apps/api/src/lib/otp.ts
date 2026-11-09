import { randomInt } from "crypto";

export function generateOtp(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += String(randomInt(0, 10));
  }
  return otp;
}

export function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
