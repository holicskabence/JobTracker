export interface CalendarEvent {
  id: number;
  type: string;
  company: string;
  date: string;
  time: string;
  notes: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface UserDocument {
  id: number;
  name: string;
  type: string;
  updated: string;
  version: string;
}

export const DOCUMENT_TYPES = ['Önéletrajz', 'Kísérőlevél', 'Portfólió', 'Egyéb'] as const;

export const OUTREACH_TEMPLATES = [
  {
    id: 1,
    title: 'Kapcsolatfelvétel jelentkezés után',
    desc: 'Használd ezt a sablont, ha LinkedIn-en szeretnél írni a cég toborzójának közvetlenül a jelentkezés leadása után.',
    text: `Kedves [Toborzó Neve]!\n\nA mai napon jelentkeztem a [Cég Neve] [Pozíció Neve] pozíciójára. Több mint 4 év React és Frontend tapasztalatommal nagyon motivált vagyok, hogy hozzájáruljak a csapat sikereihez. Mellékelten küldtem az önéletrajzomat, de örömmel küldök további részleteket is itt. Szép napot kívánok!\n\nÜdvözlettel,\n[Neved]`
  },
  {
    id: 2,
    title: 'Köszönőlevél interjú után',
    desc: 'Küldd el az interjút követő 24 órán belül, hogy megerősítsd az elhivatottságodat.',
    text: `Kedves [Interjúztató Neve]!\n\nSzeretném megköszönni a mai lehetőséget és a tartalmas beszélgetést a [Pozíció Neve] pozíció kapcsán. Nagyon tetszett az a jövőkép és technológiai szemlélet, amit bemutattatok. Bízom benne, hogy hamarosan együtt dolgozhatunk!\n\nÜdvözlettel,\n[Neved]`
  }
];
