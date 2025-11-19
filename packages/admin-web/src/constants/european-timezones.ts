// File: packages/admin-web/src/constants/european-timezones.ts
// Thư viện múi giờ châu Âu

export interface Timezone {
  value: string; // IANA timezone ID (e.g., "Europe/London")
  label: string; // Display name (e.g., "London (GMT+0)")
  country: string; // Country name
  offset: string; // UTC offset (e.g., "+00:00", "+01:00")
}

export const EUROPEAN_TIMEZONES: Timezone[] = [
  // Western Europe
  { value: 'Europe/London', label: 'London, United Kingdom (GMT+0)', country: 'United Kingdom', offset: '+00:00' },
  { value: 'Europe/Dublin', label: 'Dublin, Ireland (GMT+0)', country: 'Ireland', offset: '+00:00' },
  { value: 'Europe/Lisbon', label: 'Lisbon, Portugal (GMT+0)', country: 'Portugal', offset: '+00:00' },
  
  // Central Europe
  { value: 'Europe/Paris', label: 'Paris, France (GMT+1)', country: 'France', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin, Germany (GMT+1)', country: 'Germany', offset: '+01:00' },
  { value: 'Europe/Rome', label: 'Rome, Italy (GMT+1)', country: 'Italy', offset: '+01:00' },
  { value: 'Europe/Madrid', label: 'Madrid, Spain (GMT+1)', country: 'Spain', offset: '+01:00' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam, Netherlands (GMT+1)', country: 'Netherlands', offset: '+01:00' },
  { value: 'Europe/Brussels', label: 'Brussels, Belgium (GMT+1)', country: 'Belgium', offset: '+01:00' },
  { value: 'Europe/Vienna', label: 'Vienna, Austria (GMT+1)', country: 'Austria', offset: '+01:00' },
  { value: 'Europe/Zurich', label: 'Zurich, Switzerland (GMT+1)', country: 'Switzerland', offset: '+01:00' },
  { value: 'Europe/Stockholm', label: 'Stockholm, Sweden (GMT+1)', country: 'Sweden', offset: '+01:00' },
  { value: 'Europe/Oslo', label: 'Oslo, Norway (GMT+1)', country: 'Norway', offset: '+01:00' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen, Denmark (GMT+1)', country: 'Denmark', offset: '+01:00' },
  { value: 'Europe/Warsaw', label: 'Warsaw, Poland (GMT+1)', country: 'Poland', offset: '+01:00' },
  { value: 'Europe/Prague', label: 'Prague, Czech Republic (GMT+1)', country: 'Czech Republic', offset: '+01:00' },
  { value: 'Europe/Budapest', label: 'Budapest, Hungary (GMT+1)', country: 'Hungary', offset: '+01:00' },
  
  // Eastern Europe
  { value: 'Europe/Athens', label: 'Athens, Greece (GMT+2)', country: 'Greece', offset: '+02:00' },
  { value: 'Europe/Helsinki', label: 'Helsinki, Finland (GMT+2)', country: 'Finland', offset: '+02:00' },
  { value: 'Europe/Bucharest', label: 'Bucharest, Romania (GMT+2)', country: 'Romania', offset: '+02:00' },
  { value: 'Europe/Sofia', label: 'Sofia, Bulgaria (GMT+2)', country: 'Bulgaria', offset: '+02:00' },
  { value: 'Europe/Tallinn', label: 'Tallinn, Estonia (GMT+2)', country: 'Estonia', offset: '+02:00' },
  { value: 'Europe/Riga', label: 'Riga, Latvia (GMT+2)', country: 'Latvia', offset: '+02:00' },
  { value: 'Europe/Vilnius', label: 'Vilnius, Lithuania (GMT+2)', country: 'Lithuania', offset: '+02:00' },
  { value: 'Europe/Kiev', label: 'Kiev, Ukraine (GMT+2)', country: 'Ukraine', offset: '+02:00' },
  { value: 'Europe/Minsk', label: 'Minsk, Belarus (GMT+3)', country: 'Belarus', offset: '+03:00' },
  { value: 'Europe/Moscow', label: 'Moscow, Russia (GMT+3)', country: 'Russia', offset: '+03:00' },
  
  // Other European cities
  { value: 'Europe/Luxembourg', label: 'Luxembourg (GMT+1)', country: 'Luxembourg', offset: '+01:00' },
  { value: 'Europe/Monaco', label: 'Monaco (GMT+1)', country: 'Monaco', offset: '+01:00' },
  { value: 'Europe/Andorra', label: 'Andorra (GMT+1)', country: 'Andorra', offset: '+01:00' },
  { value: 'Europe/Belgrade', label: 'Belgrade, Serbia (GMT+1)', country: 'Serbia', offset: '+01:00' },
  { value: 'Europe/Zagreb', label: 'Zagreb, Croatia (GMT+1)', country: 'Croatia', offset: '+01:00' },
  { value: 'Europe/Sarajevo', label: 'Sarajevo, Bosnia and Herzegovina (GMT+1)', country: 'Bosnia and Herzegovina', offset: '+01:00' },
  { value: 'Europe/Skopje', label: 'Skopje, North Macedonia (GMT+1)', country: 'North Macedonia', offset: '+01:00' },
  { value: 'Europe/Tirane', label: 'Tirane, Albania (GMT+1)', country: 'Albania', offset: '+01:00' },
  { value: 'Europe/Istanbul', label: 'Istanbul, Turkey (GMT+3)', country: 'Turkey', offset: '+03:00' },
];

// Helper functions
export function getTimezonesByCountry(country: string): Timezone[] {
  return EUROPEAN_TIMEZONES.filter(tz => tz.country === country);
}

export function findTimezone(value: string): Timezone | undefined {
  return EUROPEAN_TIMEZONES.find(tz => tz.value === value);
}

