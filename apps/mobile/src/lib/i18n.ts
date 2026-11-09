import * as Localization from "expo-localization";
import i18n from "i18next";

const resources: Record<string, Record<string, string>> = {
  en: {
    welcome: "Welcome",
    schoolCode: "School Code",
    enterOtp: "Enter OTP",
    login: "Log in",
    sendingOtp: "Sending OTP...",
    verifying: "Verifying...",
    invalidOtp: "Invalid OTP",
    otpExpired: "OTP expired",
    noOtp: "No OTP issued for this number",
    tenantNotFound: "School not found",
    tenantInactive: "School account is inactive",
    today: "Today",
    fees: "Fees",
    academics: "Academics",
    messages: "Messages",
    more: "More",
    offline: "You are offline",
    syncing: "Syncing...",
  },
  ta: {
    welcome: "வரவேற்பு",
    schoolCode: "பள்ளி குறியீடு",
    enterOtp: "OTPിടவும்",
    login: "உள்நுழை",
    sendingOtp: "OTP அனுப்பப்படுகிறது...",
    verifying: "சரிபார்க்கப்படுகிறது...",
    invalidOtp: "தவறான OTP",
    otpExpired: "OTP காலாவதியானது",
    noOtp: "இந்த எண்ணுக்கு OTP வழங்கப்படவில்லை",
    tenantNotFound: "பள்ளி கிடைக்கவில்லை",
    tenantInactive: "பள்ளி கணக்கு செயலற்றது",
    today: "இன்று",
    fees: "கட்டணம்",
    academics: "கல்வி",
    messages: "செய்திகள்",
    more: "மேலும்",
    offline: "நீங்கள் آف்லைன் உள்ளீர்கள்",
    syncing: "ச暦但是...",
  },
  hi: {
    welcome: "स्वागत है",
    schoolCode: "स्कूल कोड",
    enterOtp: "OTP दर्ज करें",
    login: "लॉग इन करें",
    sendingOtp: "OTP भेजा जा रहा है...",
    verifying: "सत्यापित किया जा रहा है...",
    invalidOtp: "अमान्य OTP",
    otpExpired: "OTP समाप्त हो गया",
    noOtp: "इस नंबर के लिए कोई OTP जारी नहीं किया गया",
    tenantNotFound: "स्कूल नहीं मिला",
    tenantInactive: "स्कूल खाता निष्क्रिय है",
    today: "आज",
    fees: "शुल्क",
    academics: "शिक्षा",
    messages: "संदेश",
    more: "अधिक",
    offline: "आप ऑफलाइन हैं",
    syncing: "सिंक हो रहा है...",
  },
};

export function getLanguage() {
  return Localization.locale?.startsWith("ta") ? "ta" : Localization.locale?.startsWith("hi") ? "hi" : "en";
}

export async function initI18n() {
  await i18n.init({
    resources,
    lng: getLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export const t = (key: string) => i18n.t(key) || key;
