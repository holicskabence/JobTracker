const EVENT_COLORS: Record<string, string> = {
  'HR Megkeresés': '#f59e0b',
  'Technikai Interjú': '#5fb9fa',
  'Rendszertervezés': '#8b5cf6',
  'Tesztfeladat': '#f97316',
  'Ajánlat egyeztetés': '#26ac00'
};

export function eventColor(type: string): string {
  return EVENT_COLORS[type] ?? '#26ac00';
}

export function eventColorAlpha(type: string, alpha: number): string {
  const hex = eventColor(type).replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
