export const normalizePhoneForColombia = (value: string): string | null => {
  const digits = value.replace(/\D+/g, "");
  if (!digits) {
    return null;
  }

  const withoutLeadingZeros = digits.replace(/^0+/, "");
  if (!withoutLeadingZeros) {
    return null;
  }

  if (withoutLeadingZeros.startsWith("57") && withoutLeadingZeros.length >= 12) {
    return `+${withoutLeadingZeros}`;
  }

  if (withoutLeadingZeros.length >= 10) {
    return `+57${withoutLeadingZeros}`;
  }

  return null;
};

export const sanitizeWhatsAppText = (value: string): string => value.trim();

export const buildWhatsAppUrl = (phone: string, message: string): string => {
  const normalizedDigits = phone.replace(/\D+/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedDigits}?text=${encodedMessage}`;
};
