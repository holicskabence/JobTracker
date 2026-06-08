export type QuestionCategory = 'Technikai' | 'HR' | 'Rendszertervezés';
export type FeedbackType = 'hard' | 'good' | 'easy';

export interface PrepQuestion {
  id: number;
  category: QuestionCategory;
  question: string;
  hint: string;
  sampleAnswer: string;
}

export const PREP_QUESTIONS: PrepQuestion[] = [
  {
    id: 1,
    category: 'Technikai',
    question: 'Hogyan működik a React/Angular Virtual DOM / Change Detection és miért nyújt jobb teljesítményt?',
    hint: 'Angularban: zone.js, OnPush stratégia, signals. Általánosan: diffing algoritmus, batch update.',
    sampleAnswer: 'Az Angular alapból zone.js segítségével figyeli az aszinkron eseményeket és indít change detection ciklust. Az OnPush stratégiával csak akkor fut le, ha az Input-ok referenciája változik, ami drasztikusan csökkenti a felesleges ciklusokat. Az újabb Angular Signals rendszerben a reaktivitás teljesen granulárissá válik: csak a signal-t olvasó kifejezések frissülnek. Ez hasonló a React Virtual DOM diffing megközelítéséhez, ahol a közvetlen DOM műveletek helyett memóriában számoljuk ki a minimálisan szükséges változtatásokat.'
  },
  {
    id: 2,
    category: 'Technikai',
    question: 'Mi a különbség a state management megoldások között? Mikor érdemes NgRx-et, Signals-t vagy Service-t használni?',
    hint: 'Globális vs. lokális állapot, felesleges újrarenderelések, egyszerűség vs. skálázhatóság.',
    sampleAnswer: 'Egyszerű, lokális állapothoz elegendő egy Component Signal. Megosztott állapothoz kis-közepes alkalmazásban egy Injectable Service + Signal tökéletes, mivel kevés boilerplate-tel biztosít reaktív szinkronizációt. NGRx-re csak igazán komplex, sok akciót és side-effectet igénylő alkalmazásoknál van szükség, ahol a Redux DevTools és a time-travel debugging értéket ad. A kulcs: ne vezess be komplexitást, amíg a probléma nem igényli.'
  },
  {
    id: 3,
    category: 'HR',
    question: 'Mesélj el egy helyzetet, amikor nézeteltérésed volt egy fejlesztőtársaddal. Hogyan oldottad meg?',
    hint: 'Használd a STAR módszert. Fókuszálj az empátiára, az adatokon alapuló érvelésre és a kompromisszumra.',
    sampleAnswer: 'Egy projektben a PM azonnali kiadást kért egy animált funkcióhoz, ami szerintem rontotta az akadálymentesítést. Ahelyett, hogy konfrontálódtam volna, gyors Lighthouse-tesztet csináltam mindkét verzióhoz és megmutattam a számadatokat. Felajánlottam egy CSS-alapú átmenetet, ami vizuálisan szép volt, de nem terhelte a processzort. A PM elfogadta, a funkció időben és minőségben jelent meg. A tanulság: az adatokkal alátámasztott javaslat sokkal meggyőzőbb a konfrontációnál.'
  },
  {
    id: 4,
    category: 'Rendszertervezés',
    question: 'Hogyan terveznél meg egy képekkel teli közösségi feedet minimális betöltési idővel?',
    hint: 'Lazy loading, CDN, WebP/AVIF formátumok, Infinite scroll, lista-virtualizáció.',
    sampleAnswer: 'Több rétegű megközelítést alkalmaznék. Infrastrukturálisan: CDN (pl. Cloudflare) a képek kiszolgálásához, modern formátumokban (WebP/AVIF) és reszponzív méretekben (srcset). Frontenden: Intersection Observer alapú Lazy Loading, hogy csak a látható képek töltődjenek be. A felhasználói élményhez LQIP (Low Quality Image Placeholder) blur-t mutatnék betöltés alatt. A lista-teljesítményhez virtualizált scrollt (CDK Virtual Scroll Angularban) alkalmaznék, hogy egyszerre csak 20-30 DOM elem létezzen, függetlenül az adatok számától.'
  },
  {
    id: 5,
    category: 'HR',
    question: 'Hol látod magad 5 év múlva szakmailag, és hogyan támogatja ezt a pozíció?',
    hint: 'Mutass elhivatottságot a folyamatos tanulás és az esetleges Tech Lead / mentori szerepek iránt.',
    sampleAnswer: 'Szeretném elmélyíteni a tudásom a modern frontend architektúrák és a teljesítmény-optimalizáció terén, de a célom az is, hogy aktív mentorként és technológiai döntéshozóként (Tech Lead) segítsem a csapatot. Ez a pozíció a komplex, skálázódó termékkel kiváló lehetőséget ad mélyebb technológiai kihívások leküzdésére, miközben a növekvő fejlesztői csapat teret enged a vezetői képességeim fejlesztéséhez is.'
  },
  {
    id: 6,
    category: 'Technikai',
    question: 'Magyarázd el a CSS specificitást és mikor okozhat problémát egy nagy alkalmazásban.',
    hint: 'Inline > ID > Class > Element. CSS Modules, BEM, scoped styles mint megoldások.',
    sampleAnswer: 'A CSS specificitás határozza meg, melyik stílusszabály "nyeri" az ütközést: inline style (1000) > ID (100) > Class/Pseudo-class/Attribute (10) > Element (1). Nagy alkalmazásban ez "specificity war"-hoz vezet, ahol fejlesztők egyre magasabb specificitású szelektorokat írnak a felülíráshoz, ami karbantartási rémálomhoz vezet. Megoldások: BEM névadási konvenció (a class alapú hierarchia olvasható marad), CSS Modules vagy Angular Scoped Styles (komponent-szintű izoláció), vagy utility-first CSS mint Tailwind, ahol az összes osztály 10-es specificitású.'
  },
  {
    id: 7,
    category: 'Rendszertervezés',
    question: 'Tervezz meg egy valós idejű értesítési rendszert (pl. chat alkalmazáshoz).',
    hint: 'WebSocket vs. SSE vs. Long Polling. Reconnection logika, message queue, scale-out.',
    sampleAnswer: 'Valós idejű, kétirányú kommunikációhoz WebSocket a legjobb. Az architektúra: frontend WebSocket kapcsolat egy Gateway szerverre (pl. Socket.io/SignalR), amely Redis Pub/Sub-on keresztül kommunikál a háttérszolgáltatásokkal. Ez lehetővé teszi a horizontális skálázást, mivel minden Gateway-példány feliratkozik a releváns csatornákra. Fontosak még: automatikus reconnection exponenciális backoff-fal, üzenet-sorrend garantálása (sequence number), offline üzenetek tárolása Message Queue-ban (pl. RabbitMQ) és a kapcsolat állapotának kijelzése a UI-on.'
  },
  {
    id: 8,
    category: 'Technikai',
    question: 'Mi az a TypeScript Generic és mikor érdemes használni?',
    hint: 'Típusbiztonság kódismétlés nélkül. Constraints, default types, conditional types.',
    sampleAnswer: 'A Generic egy típusparaméter, amely lehetővé teszi, hogy egy függvény vagy osztály különböző típusokkal működjön anélkül, hogy elveszítené a típusbiztonságot. Pl. egy `function identity<T>(arg: T): T` bármely típussal hívható és a visszatérési értéke is pontosan az a típus lesz. Érdemes használni: generikus adatstruktúráknál (Repository<T>), API wrapper-eknél (ApiResponse<T>), hook-oknál és utility típusoknál. Constraint-ekkel (`<T extends object>`) tovább szűkíthetjük a megengedett típusokat.'
  }
];
