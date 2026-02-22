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
  // Filter for Spanish voices and EXCLUDE Vernon
  const spanishVoices = systemVoices.filter(v =>
    v.lang.toLowerCase().includes('es') &&
    !v.name.toLowerCase().includes('vernon')
  );

  // Map directly to system voices
  return spanishVoices.map((voice, index) => {
    const isMale = isGender(voice, 'male');
    const gender = isMale ? 'male' : 'female';

    // Create a simplified label (JUST THE NAME)
    // e.g. "Microsoft Helena Desktop - Spanish (Spain)" -> "Helena"
    // e.g. "Google español" -> "Google español"
    let label = voice.name;

    // 1. Remove "Microsoft" and "Desktop" (case insensitive)
    label = label.replace(/Microsoft\s+/i, '').replace(/\s+Desktop/i, '');

    // 2. Take only the part before " - " or similar separators if they exist
    // "Helena - Spanish (Spain)" -> "Helena"
    if (label.includes(' - ')) {
      label = label.split(' - ')[0];
    }

    // 3. Remove any parenthetical info like "(Spain)", "(es-ES)"
    label = label.replace(/\s*\(.*?\)\s*/g, '');

    // 4. Final trim
    label = label.trim();

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
