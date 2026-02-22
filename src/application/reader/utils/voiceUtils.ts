export interface VirtualVoice {
  id: string;
  label: string;
  locale: string;
  gender: 'male' | 'female';
  systemVoice: SpeechSynthesisVoice | null;
  matchType?: 'exact' | 'region' | 'fallback' | 'default';
}

function isGender(voice: SpeechSynthesisVoice, gender: 'male' | 'female'): boolean {
  const name = voice.name.toLowerCase();
  // Common female names/indicators
  if (gender === 'female') {
    return name.includes('female') || name.includes('femenina') || name.includes('woman') ||
      name.includes('monica') || name.includes('paulina') || name.includes('sabina') ||
      name.includes('helena') || name.includes('zira') || name.includes('francisca') ||
      name.includes('samantha') || name.includes('victoria') || name.includes('yuri') ||
      name.includes('laura') || name.includes('mia') || name.includes('zira') ||
      name.includes('google español') || // "Google español" is usually female
      name.includes('google español de latinoamérica'); // "Google español de Latinoamérica" is usually female
  }
  // Common male names/indicators
  else {
    return name.includes('male') || name.includes('masculino') || name.includes('hombre') ||
      name.includes('jorge') || name.includes('juan') || name.includes('diego') ||
      name.includes('pablo') || name.includes('raul') || name.includes('miguel') ||
      name.includes('pedro') || name.includes('daniel') || name.includes('jose') ||
      name.includes('david') || name.includes('mark') || name.includes('stefan') ||
      name.includes('roberto') || name.includes('carlos') || name.includes('fernando') ||
      name.includes('antonio') || name.includes('manuel') || name.includes('alberto') ||
      name.includes('vernon'); // Vernon is a common male voice in some browsers
  }
}

export function mapSystemVoicesToVirtual(systemVoices: SpeechSynthesisVoice[]): VirtualVoice[] {
  // Filter for Spanish voices (must start with 'es', e.g. 'es-ES', 'es-MX')
  // This excludes 'ca-ES' (Catalan) which contains 'es' but starts with 'ca'
  const spanishVoices = systemVoices.filter(v =>
    (v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase() === 'es') &&
    !v.name.toLowerCase().includes('vernon')
  );

  // Map directly to system voices
  return spanishVoices.map((voice, index) => {
    const isMale = isGender(voice, 'male');
    const gender = isMale ? 'male' : 'female';

    // Create a simplified label (JUST THE NAME)
    let label = voice.name;

    // 1. Remove "Microsoft" and "Desktop" (case insensitive)
    label = label.replace(/Microsoft\s+/i, '').replace(/\s+Desktop/i, '');

    // 2. Take only the part before " - " or similar separators if they exist
    if (label.includes(' - ')) {
      label = label.split(' - ')[0];
    }

    // 3. Remove "Android Speech Recognition Service" or similar prefixes commonly found on Android
    label = label.replace(/^Android\s+Speech\s+Recognition\s+Service\s+/i, '');

    // 4. Remove any parenthetical info like "(Spain)", "(es-ES)"
    // BUT check if removing it leaves the string empty or too generic
    const labelWithoutParens = label.replace(/\s*\(.*?\)\s*/g, '').trim();

    // If stripping parens leaves us with something meaningful, use it.
    if (labelWithoutParens.length > 2) {
      label = labelWithoutParens;
    }

    // 5. Final trim
    label = label.trim();

    // 6. Try to remove language names if there are other words
    // e.g. "Google Español" -> "Google"
    // e.g. "Samsung Spanish" -> "Samsung"
    const langRegex = /\b(español|spanish|es|spain|españa|mexico|méxico|united states|estados unidos|latinoamérica|latin america)\b/gi;
    const labelWithoutLang = label.replace(langRegex, '').replace(/\s+/g, ' ').trim();

    if (labelWithoutLang.length > 1) {
      label = labelWithoutLang;
    }

    // 7. Capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);

    // Ensure unique ID
    const id = `sys-${voice.lang}-${index}-${gender}`;

    return {
      id,
      label,
      locale: voice.lang,
      gender,
      systemVoice: voice,
      matchType: 'exact'
    };
  });
}
