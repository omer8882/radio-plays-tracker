import eco99Logo from '../assets/eco99_logo.png';
import glglzLogo from '../assets/glglz_logo.png';
import fm100Logo from '../assets/100fm_logo.png';
import kan88Logo from '../assets/kan88_logo.png';
import fm103Logo from '../assets/103fm_logo.png';
import galatzLogo from '../assets/galatz_logo.png';

export const STATIONS = [
  { name: 'galatz', displayName: 'גל"צ', logo: galatzLogo, bgColor: '#dbd944' },
  //{ name: '103fm', displayName: '103FM', logo: fm103Logo, bgColor: '#64D1DE' },
  { name: 'kan88', displayName: 'כאן 88', logo: kan88Logo, bgColor: '#b38bae' },
  { name: '100fm', displayName: '100FM', logo: fm100Logo, bgColor: '#cccc31' },
  { name: 'eco99', displayName: 'Eco 99FM', logo: eco99Logo, bgColor: '#BBDEFB' },
  { name: 'glglz', displayName: 'גלגלצ', logo: glglzLogo, bgColor: '#D1C4E9' }
];

export const STATION_FILTER_OPTIONS = [
  { value: '', label: 'כל התחנות' },
  ...STATIONS.map(({ name, displayName }) => ({ value: name, label: displayName }))
];

export const STATION_LABEL_LOOKUP = STATIONS.reduce((accumulator, station) => {
  accumulator[station.name] = station.displayName;
  accumulator[station.name.toLowerCase()] = station.displayName;
  return accumulator;
}, {});
