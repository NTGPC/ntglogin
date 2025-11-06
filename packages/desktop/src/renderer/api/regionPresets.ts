interface RegionPreset {
  name: string
  type: string
  config: any
}

function tl(locale: string, timezoneId: string, languages?: string[]): any {
  return { locale, timezoneId, languages: languages || [locale, locale.split('-')[0]] }
}

export const regionPresets: RegionPreset[] = [
  // Châu Mỹ
  { name: 'USA (en-US, America/Los_Angeles)', type: 'timezone', config: tl('en-US', 'America/Los_Angeles') },
  { name: 'Canada (en-CA, America/Toronto)', type: 'timezone', config: tl('en-CA', 'America/Toronto') },
  { name: 'Mexico (es-MX, America/Mexico_City)', type: 'timezone', config: tl('es-MX', 'America/Mexico_City') },
  { name: 'Argentina (es-AR, America/Argentina/Buenos_Aires)', type: 'timezone', config: tl('es-AR', 'America/Argentina/Buenos_Aires') },
  { name: 'Bolivia (es-BO, America/La_Paz)', type: 'timezone', config: tl('es-BO', 'America/La_Paz') },
  { name: 'Brazil (pt-BR, America/Sao_Paulo)', type: 'timezone', config: tl('pt-BR', 'America/Sao_Paulo') },
  { name: 'Chile (es-CL, America/Santiago)', type: 'timezone', config: tl('es-CL', 'America/Santiago') },
  { name: 'Colombia (es-CO, America/Bogota)', type: 'timezone', config: tl('es-CO', 'America/Bogota') },
  { name: 'Ecuador (es-EC, America/Guayaquil)', type: 'timezone', config: tl('es-EC', 'America/Guayaquil') },
  { name: 'Peru (es-PE, America/Lima)', type: 'timezone', config: tl('es-PE', 'America/Lima') },
  { name: 'Guatemala (es-GT, America/Guatemala)', type: 'timezone', config: tl('es-GT', 'America/Guatemala') },
  { name: 'Honduras (es-HN, America/Tegucigalpa)', type: 'timezone', config: tl('es-HN', 'America/Tegucigalpa') },
  { name: 'El Salvador (es-SV, America/El_Salvador)', type: 'timezone', config: tl('es-SV', 'America/El_Salvador') },

  // Châu Âu
  { name: 'Austria (de-AT, Europe/Vienna)', type: 'timezone', config: tl('de-AT', 'Europe/Vienna') },
  { name: 'Belgium (nl-BE, Europe/Brussels)', type: 'timezone', config: tl('nl-BE', 'Europe/Brussels', ['nl-BE','nl']) },
  { name: 'Denmark (da-DK, Europe/Copenhagen)', type: 'timezone', config: tl('da-DK', 'Europe/Copenhagen') },
  { name: 'France (fr-FR, Europe/Paris)', type: 'timezone', config: tl('fr-FR', 'Europe/Paris') },
  { name: 'Germany (de-DE, Europe/Berlin)', type: 'timezone', config: tl('de-DE', 'Europe/Berlin') },
  { name: 'Ireland (en-IE, Europe/Dublin)', type: 'timezone', config: tl('en-IE', 'Europe/Dublin') },
  { name: 'Italy (it-IT, Europe/Rome)', type: 'timezone', config: tl('it-IT', 'Europe/Rome') },
  { name: 'Netherlands (nl-NL, Europe/Amsterdam)', type: 'timezone', config: tl('nl-NL', 'Europe/Amsterdam') },
  { name: 'Norway (nb-NO, Europe/Oslo)', type: 'timezone', config: tl('nb-NO', 'Europe/Oslo') },
  { name: 'Poland (pl-PL, Europe/Warsaw)', type: 'timezone', config: tl('pl-PL', 'Europe/Warsaw') },
  { name: 'Romania (ro-RO, Europe/Bucharest)', type: 'timezone', config: tl('ro-RO', 'Europe/Bucharest') },
  { name: 'Spain (es-ES, Europe/Madrid)', type: 'timezone', config: tl('es-ES', 'Europe/Madrid') },
  { name: 'Sweden (sv-SE, Europe/Stockholm)', type: 'timezone', config: tl('sv-SE', 'Europe/Stockholm') },
  { name: 'Switzerland (de-CH, Europe/Zurich)', type: 'timezone', config: tl('de-CH', 'Europe/Zurich', ['de-CH', 'de']) },
  { name: 'Turkey (tr-TR, Europe/Istanbul)', type: 'timezone', config: tl('tr-TR', 'Europe/Istanbul') },
  { name: 'Ukraine (uk-UA, Europe/Kyiv)', type: 'timezone', config: tl('uk-UA', 'Europe/Kyiv') },

  // Châu Á – Trung Đông
  { name: 'Bangladesh (bn-BD, Asia/Dhaka)', type: 'timezone', config: tl('bn-BD', 'Asia/Dhaka') },
  { name: 'Hong Kong (zh-HK, Asia/Hong_Kong)', type: 'timezone', config: tl('zh-HK', 'Asia/Hong_Kong', ['zh-HK','zh']) },
  { name: 'India (en-IN, Asia/Kolkata)', type: 'timezone', config: tl('en-IN', 'Asia/Kolkata') },
  { name: 'Indonesia (id-ID, Asia/Jakarta)', type: 'timezone', config: tl('id-ID', 'Asia/Jakarta') },
  { name: 'Iraq (ar-IQ, Asia/Baghdad)', type: 'timezone', config: tl('ar-IQ', 'Asia/Baghdad', ['ar-IQ','ar']) },
  { name: 'Israel (he-IL, Asia/Jerusalem)', type: 'timezone', config: tl('he-IL', 'Asia/Jerusalem', ['he-IL','he']) },
  { name: 'Japan (ja-JP, Asia/Tokyo)', type: 'timezone', config: tl('ja-JP', 'Asia/Tokyo') },
  { name: 'Jordan (ar-JO, Asia/Amman)', type: 'timezone', config: tl('ar-JO', 'Asia/Amman', ['ar-JO','ar']) },
  { name: 'Malaysia (ms-MY, Asia/Kuala_Lumpur)', type: 'timezone', config: tl('ms-MY', 'Asia/Kuala_Lumpur') },
  { name: 'Philippines (en-PH, Asia/Manila)', type: 'timezone', config: tl('en-PH', 'Asia/Manila') },
  { name: 'Saudi Arabia (ar-SA, Asia/Riyadh)', type: 'timezone', config: tl('ar-SA', 'Asia/Riyadh', ['ar-SA','ar']) },
  { name: 'Singapore (en-SG, Asia/Singapore)', type: 'timezone', config: tl('en-SG', 'Asia/Singapore') },
  { name: 'South Korea (ko-KR, Asia/Seoul)', type: 'timezone', config: tl('ko-KR', 'Asia/Seoul') },
  { name: 'Taiwan (zh-TW, Asia/Taipei)', type: 'timezone', config: tl('zh-TW', 'Asia/Taipei', ['zh-TW','zh']) },
  { name: 'Thailand (th-TH, Asia/Bangkok)', type: 'timezone', config: tl('th-TH', 'Asia/Bangkok') },
  { name: 'UAE (ar-AE, Asia/Dubai)', type: 'timezone', config: tl('ar-AE', 'Asia/Dubai', ['ar-AE','ar']) },

  // Châu Phi
  { name: 'Egypt (ar-EG, Africa/Cairo)', type: 'timezone', config: tl('ar-EG', 'Africa/Cairo', ['ar-EG','ar']) },
  { name: 'Morocco (fr-MA, Africa/Casablanca)', type: 'timezone', config: tl('fr-MA', 'Africa/Casablanca', ['fr-MA','fr']) },
  { name: 'South Africa (en-ZA, Africa/Johannesburg)', type: 'timezone', config: tl('en-ZA', 'Africa/Johannesburg') },

  // Châu Đại Dương
  { name: 'Australia (en-AU, Australia/Sydney)', type: 'timezone', config: tl('en-AU', 'Australia/Sydney') },
  { name: 'New Zealand (en-NZ, Pacific/Auckland)', type: 'timezone', config: tl('en-NZ', 'Pacific/Auckland') },
]


