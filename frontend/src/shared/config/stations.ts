export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const STATIONS: Station[] = [
  { id: "st_01", name: "Київ-Пасажирський", lat: 50.4401, lng: 30.4927 },
  { id: "st_02", name: "Львів", lat: 49.8397, lng: 24.0297 },
  { id: "st_03", name: "Одеса", lat: 46.4825, lng: 30.7233 },
  { id: "st_04", name: "Дніпро", lat: 48.4647, lng: 35.0462 },
  { id: "st_05", name: "Харків", lat: 49.9935, lng: 36.2304 },
  { id: "st_06", name: "Запоріжжя", lat: 47.8388, lng: 35.1396 },
  { id: "st_07", name: "Вінниця", lat: 49.2331, lng: 28.4682 },
  { id: "st_08", name: "Полтава", lat: 49.5883, lng: 34.5514 },
  { id: "st_09", name: "Чернігів", lat: 51.4982, lng: 31.2893 },
  { id: "st_10", name: "Кривий Ріг", lat: 47.9105, lng: 33.3918 },
  { id: "st_11", name: "Суми", lat: 50.9077, lng: 34.7981 },
  { id: "st_12", name: "Житомир", lat: 50.2547, lng: 28.6587 },
  { id: "st_13", name: "Хмельницький", lat: 49.4229, lng: 26.9871 },
  { id: "st_14", name: "Черкаси", lat: 49.4444, lng: 32.0598 },
  { id: "st_15", name: "Рівне", lat: 50.6199, lng: 26.2516 },
  { id: "st_16", name: "Івано-Франківськ", lat: 48.9226, lng: 24.7111 },
  { id: "st_17", name: "Тернопіль", lat: 49.5535, lng: 25.5948 },
  { id: "st_18", name: "Луцьк", lat: 50.7472, lng: 25.3254 },
  { id: "st_19", name: "Ужгород", lat: 48.6208, lng: 22.2879 },
  { id: "st_20", name: "Миколаїв", lat: 46.975, lng: 32.0 },
  { id: "st_21", name: "Кременчук", lat: 49.0658, lng: 33.42 },
  { id: "st_22", name: "Знам'янка", lat: 48.7117, lng: 32.665 },
  { id: "st_23", name: "Козятин", lat: 49.7142, lng: 28.835 },
  { id: "st_24", name: "Фастів", "lat": 50.0747, "lng": 29.9185 },
  { id: "st_25", name: "Шепетівка", "lat": 50.1833, "lng": 27.0667 },
];

export function getStationById(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}
