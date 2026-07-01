# demo

Repozytorium zawiera szkoleniowy artifact React JSX: [`dashboard-wycinek.jsx`](./dashboard-wycinek.jsx).

## Dashboard planowania wycinek

Komponent React symulujący czas do osiągnięcia strefy krytycznej przez drzewa
rosnące pod liniami wysokiego napięcia, na podstawie tempa przyrostu wybranego
gatunku, aktualnego odstępu od przewodów i planowanego zapasu bezpieczeństwa.

**Wszystkie dane i wyniki są fikcyjne** — aplikacja służy wyłącznie do celów
demonstracyjnych i szkoleniowych, nie do rzeczywistego planowania prac przy
liniach energetycznych.

Na tym etapie kod celowo pozostaje w jednym pliku JSX (bez projektu
Vite/`package.json`). Kolejnym krokiem będzie migracja do **React 19 + Vite**
z buildem do pojedynczego pliku `dist/index.html`.
