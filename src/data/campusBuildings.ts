import { Coordinate } from '../types';

export interface CampusZone {
  id: string;
  name: string;
  description: string;
  icon: string;
  coord: Coordinate;
}

export const CAMPUS_ZONES: CampusZone[] = [
  { id: 'eng', name: '공과대학 권역', description: '1, 2, 3호관 주변', icon: '🏗️', coord: { lat: 36.3680, lng: 127.3460 } },
  { id: 'sci', name: '자연과학대학 권역', description: '기초과학관 주변', icon: '🔬', coord: { lat: 36.3675, lng: 127.3450 } },
  { id: 'hq', name: '대학본부 권역', description: '중앙도서관 방면', icon: '🏛️', coord: { lat: 36.3672, lng: 127.3430 } },
  { id: 'agri', name: '농생대 권역', description: '실험농장 주변', icon: '🌾', coord: { lat: 36.3690, lng: 127.3400 } },
];
