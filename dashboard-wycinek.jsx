/**
 * dashboard-wycinek.jsx
 *
 * Szkoleniowy dashboard planowania wycinek drzew pod liniami wysokiego napięcia.
 *
 * UWAGA: To jest aplikacja demonstracyjna i szkoleniowa. Wszystkie dane
 * (gatunki drzew, tempo przyrostu, obliczenia) są FIKCYJNE i nie mogą być
 * używane do rzeczywistego planowania prac przy liniach energetycznych.
 *
 * Docelowo ten plik zostanie przeniesiony do projektu React 19 + Vite
 * (vite-plugin-singlefile, build do dist/index.html). Na tym etapie
 * celowo pozostaje jednym samodzielnym plikiem JSX.
 */

import React, { useEffect, useMemo, useState } from "react";

/* -------------------------------------------------------------------------- */
/* Dane gatunków drzew                                                         */
/* -------------------------------------------------------------------------- */

const TREE_SPECIES = [
  { id: "sosna", label: "Sosna", growthCmPerYear: 50 },
  { id: "brzoza", label: "Brzoza", growthCmPerYear: 80 },
  { id: "dab", label: "Dąb", growthCmPerYear: 40 },
  { id: "topola", label: "Topola", growthCmPerYear: 110 },
];

const DEFAULT_SPECIES_ID = "sosna";
const DEFAULT_CLEARANCE_M = 4;
const DEFAULT_SAFETY_MARGIN_M = 1.5;

const CLEARANCE_MIN = 0.5;
const CLEARANCE_MAX = 10;
const CLEARANCE_STEP = 0.1;

const SAFETY_MARGIN_MIN = 1.0;
const SAFETY_MARGIN_MAX = 3.0;
const SAFETY_MARGIN_STEP = 0.1;

/* -------------------------------------------------------------------------- */
/* Funkcje pomocnicze — obliczenia                                             */
/* -------------------------------------------------------------------------- */

function getSpeciesById(speciesId) {
  return (
    TREE_SPECIES.find((species) => species.id === speciesId) ??
    TREE_SPECIES.find((species) => species.id === DEFAULT_SPECIES_ID)
  );
}

function calculateAvailableMargin(currentClearanceM, safetyMarginM) {
  return currentClearanceM - safetyMarginM;
}

function calculateMonthsUntilIntervention(availableMarginM, growthCmPerYear) {
  if (availableMarginM <= 0) {
    return null; // interwencja wymagana natychmiast
  }
  const growthMPerYear = growthCmPerYear / 100;
  const months = (availableMarginM / growthMPerYear) * 12;
  return Math.round(months);
}

function getRiskStatus(months) {
  if (months === null) {
    return {
      key: "critical",
      label: "Interwencja wymagana natychmiast",
      color: "var(--color-critical)",
    };
  }
  if (months > 24) {
    return { key: "safe", label: "Bezpiecznie", color: "var(--color-safe)" };
  }
  if (months >= 12) {
    return {
      key: "watch",
      label: "Do obserwacji",
      color: "var(--color-watch)",
    };
  }
  return {
    key: "plan",
    label: "Planować interwencję",
    color: "var(--color-plan)",
  };
}

/** Zwraca wypełnienie paska ryzyka w procentach (0-100). Krócej = bliżej krytycznego stanu. */
function getRiskBarPercent(months) {
  if (months === null) return 100;
  const CAP_MONTHS = 36;
  const clamped = Math.min(months, CAP_MONTHS);
  return Math.round((1 - clamped / CAP_MONTHS) * 100);
}

/* -------------------------------------------------------------------------- */
/* Funkcje pomocnicze — localStorage                                          */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "dashboard-wycinek:settings";

function loadSettingsFromStorage() {
  const fallback = {
    speciesId: DEFAULT_SPECIES_ID,
    currentClearanceM: DEFAULT_CLEARANCE_M,
    safetyMarginM: DEFAULT_SAFETY_MARGIN_M,
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    const speciesId = getSpeciesById(parsed.speciesId)?.id
      ? parsed.speciesId
      : DEFAULT_SPECIES_ID;

    const currentClearanceM =
      typeof parsed.currentClearanceM === "number" &&
      parsed.currentClearanceM >= CLEARANCE_MIN &&
      parsed.currentClearanceM <= CLEARANCE_MAX
        ? parsed.currentClearanceM
        : DEFAULT_CLEARANCE_M;

    const safetyMarginM =
      typeof parsed.safetyMarginM === "number" &&
      parsed.safetyMarginM >= SAFETY_MARGIN_MIN &&
      parsed.safetyMarginM <= SAFETY_MARGIN_MAX
        ? parsed.safetyMarginM
        : DEFAULT_SAFETY_MARGIN_M;

    return { speciesId, currentClearanceM, safetyMarginM };
  } catch {
    return fallback;
  }
}

function saveSettingsToStorage(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage niedostępny (np. tryb prywatny) — ustawienia po prostu nie zostaną zapamiętane.
  }
}

/* -------------------------------------------------------------------------- */
/* Komponenty UI                                                              */
/* -------------------------------------------------------------------------- */

function Disclaimer() {
  return (
    <div className="disclaimer">
      Dane i wyniki są fikcyjne. Aplikacja służy wyłącznie do celów
      demonstracyjnych i szkoleniowych.
    </div>
  );
}

function SettingsPanel({
  speciesId,
  onSpeciesChange,
  currentClearanceM,
  onCurrentClearanceChange,
  safetyMarginM,
  onSafetyMarginChange,
}) {
  return (
    <section className="panel">
      <h2 className="panel-title">Ustawienia</h2>

      <div className="field">
        <label htmlFor="species-select">Dominujący gatunek drzewa</label>
        <select
          id="species-select"
          value={speciesId}
          onChange={(event) => onSpeciesChange(event.target.value)}
        >
          {TREE_SPECIES.map((species) => (
            <option key={species.id} value={species.id}>
              {species.label} ({species.growthCmPerYear} cm/rok)
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="clearance-range">
          Aktualny odstęp od przewodów
          <span className="field-value">{currentClearanceM.toFixed(1)} m</span>
        </label>
        <input
          id="clearance-range"
          type="range"
          min={CLEARANCE_MIN}
          max={CLEARANCE_MAX}
          step={CLEARANCE_STEP}
          value={currentClearanceM}
          onChange={(event) =>
            onCurrentClearanceChange(Number(event.target.value))
          }
        />
      </div>

      <div className="field">
        <label htmlFor="safety-margin-range">
          Planowany zapas bezpieczeństwa
          <span className="field-value">{safetyMarginM.toFixed(1)} m</span>
        </label>
        <input
          id="safety-margin-range"
          type="range"
          min={SAFETY_MARGIN_MIN}
          max={SAFETY_MARGIN_MAX}
          step={SAFETY_MARGIN_STEP}
          value={safetyMarginM}
          onChange={(event) =>
            onSafetyMarginChange(Number(event.target.value))
          }
        />
      </div>
    </section>
  );
}

function RiskBar({ percent, color }) {
  return (
    <div className="risk-bar-track" aria-hidden="true">
      <div
        className="risk-bar-fill"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ResultPanel({ months, availableMarginM, risk }) {
  const riskBarPercent = getRiskBarPercent(months);

  return (
    <section className="panel">
      <h2 className="panel-title">Wynik</h2>

      {months === null ? (
        <p className="result-critical">Interwencja wymagana natychmiast</p>
      ) : (
        <p className="result-value">
          Szacowany czas do interwencji: <strong>{months}</strong> mies.
        </p>
      )}

      <div className="risk-status" style={{ color: risk.color }}>
        Status ryzyka: <strong>{risk.label}</strong>
      </div>

      <RiskBar percent={riskBarPercent} color={risk.color} />

      <p className="margin-info">
        Dostępny margines: <strong>{availableMarginM.toFixed(2)} m</strong>
      </p>
    </section>
  );
}

function DataSummary({
  species,
  currentClearanceM,
  safetyMarginM,
  availableMarginM,
  months,
}) {
  return (
    <section className="panel">
      <h2 className="panel-title">Podsumowanie danych</h2>
      <dl className="data-list">
        <dt>Wybrany gatunek</dt>
        <dd>{species.label}</dd>

        <dt>Tempo przyrostu</dt>
        <dd>{species.growthCmPerYear} cm/rok</dd>

        <dt>Aktualny odstęp od przewodów</dt>
        <dd>{currentClearanceM.toFixed(1)} m</dd>

        <dt>Planowany zapas bezpieczeństwa</dt>
        <dd>{safetyMarginM.toFixed(1)} m</dd>

        <dt>Dostępny margines</dt>
        <dd>{availableMarginM.toFixed(2)} m</dd>

        <dt>Szacowany czas do interwencji</dt>
        <dd>{months === null ? "natychmiast" : `${months} mies.`}</dd>
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Style (czysty CSS, tokeny jako zmienne CSS)                                */
/* -------------------------------------------------------------------------- */

function DashboardStyles() {
  return (
    <style>{`
      .dashboard-wycinek {
        --color-bg: #10151c;
        --color-panel: #1a222c;
        --color-text: #e8edf3;
        --color-muted: #8b98a8;
        --color-border: #2b3644;
        --color-safe: #3ecf6e;
        --color-watch: #e8c547;
        --color-plan: #f2994a;
        --color-critical: #ef4b4b;
        --radius-md: 8px;
        --radius-lg: 14px;
        --space-sm: 8px;
        --space-md: 16px;
        --space-lg: 28px;
        --shadow-panel: 0 4px 18px rgba(0, 0, 0, 0.35);

        background: linear-gradient(180deg, var(--color-bg), #0b1016);
        color: var(--color-text);
        min-height: 100vh;
        padding: var(--space-lg) var(--space-md);
        font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
      }

      .dashboard-wycinek *,
      .dashboard-wycinek *::before,
      .dashboard-wycinek *::after {
        box-sizing: inherit;
      }

      .dashboard-header {
        max-width: 1100px;
        margin: 0 auto var(--space-lg) auto;
      }

      .dashboard-title {
        font-size: 1.8rem;
        margin: 0 0 var(--space-sm) 0;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .dashboard-description {
        color: var(--color-muted);
        margin: 0 0 var(--space-md) 0;
        max-width: 720px;
        line-height: 1.5;
      }

      .disclaimer {
        background: rgba(239, 75, 75, 0.1);
        border: 1px solid rgba(239, 75, 75, 0.4);
        color: #ffb4b4;
        border-radius: var(--radius-md);
        padding: var(--space-sm) var(--space-md);
        font-size: 0.9rem;
        max-width: 720px;
      }

      .dashboard-grid {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-md);
        align-items: start;
      }

      @media (max-width: 860px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      .panel {
        background: var(--color-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-panel);
        padding: var(--space-md);
      }

      .panel-title {
        margin: 0 0 var(--space-md) 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
      }

      .field:last-child {
        margin-bottom: 0;
      }

      .field label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        color: var(--color-muted);
      }

      .field-value {
        color: var(--color-text);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      .field select {
        background: var(--color-bg);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 10px 12px;
        font-size: 0.95rem;
      }

      .field select:focus,
      .field input[type="range"]:focus-visible {
        outline: 2px solid #5aa9ff;
        outline-offset: 2px;
      }

      .field input[type="range"] {
        width: 100%;
        accent-color: #5aa9ff;
      }

      .result-value {
        font-size: 1.5rem;
        margin: 0 0 var(--space-md) 0;
      }

      .result-critical {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-critical);
        margin: 0 0 var(--space-md) 0;
      }

      .risk-status {
        font-size: 1rem;
        margin-bottom: var(--space-sm);
      }

      .risk-bar-track {
        width: 100%;
        height: 12px;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: var(--space-md);
      }

      .risk-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.2s ease, background-color 0.2s ease;
      }

      .margin-info {
        color: var(--color-muted);
        margin: 0;
      }

      .data-list {
        display: grid;
        grid-template-columns: 1fr auto;
        row-gap: var(--space-sm);
        column-gap: var(--space-md);
        margin: 0;
      }

      .data-list dt {
        color: var(--color-muted);
        font-size: 0.9rem;
      }

      .data-list dd {
        margin: 0;
        text-align: right;
        font-weight: 600;
      }
    `}</style>
  );
}

/* -------------------------------------------------------------------------- */
/* Komponent główny                                                           */
/* -------------------------------------------------------------------------- */

export default function DashboardWycinek() {
  const initialSettings = useMemo(() => loadSettingsFromStorage(), []);

  const [speciesId, setSpeciesId] = useState(initialSettings.speciesId);
  const [currentClearanceM, setCurrentClearanceM] = useState(
    initialSettings.currentClearanceM
  );
  const [safetyMarginM, setSafetyMarginM] = useState(
    initialSettings.safetyMarginM
  );

  useEffect(() => {
    saveSettingsToStorage({ speciesId, currentClearanceM, safetyMarginM });
  }, [speciesId, currentClearanceM, safetyMarginM]);

  const species = getSpeciesById(speciesId);
  const availableMarginM = calculateAvailableMargin(
    currentClearanceM,
    safetyMarginM
  );
  const months = calculateMonthsUntilIntervention(
    availableMarginM,
    species.growthCmPerYear
  );
  const risk = getRiskStatus(months);

  return (
    <div className="dashboard-wycinek">
      <DashboardStyles />

      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard planowania wycinek</h1>
        <p className="dashboard-description">
          Szkoleniowa symulacja czasu do osiągnięcia strefy krytycznej przez
          drzewa rosnące pod liniami wysokiego napięcia.
        </p>
        <Disclaimer />
      </header>

      <main className="dashboard-grid">
        <SettingsPanel
          speciesId={speciesId}
          onSpeciesChange={setSpeciesId}
          currentClearanceM={currentClearanceM}
          onCurrentClearanceChange={setCurrentClearanceM}
          safetyMarginM={safetyMarginM}
          onSafetyMarginChange={setSafetyMarginM}
        />

        <ResultPanel
          months={months}
          availableMarginM={availableMarginM}
          risk={risk}
        />

        <DataSummary
          species={species}
          currentClearanceM={currentClearanceM}
          safetyMarginM={safetyMarginM}
          availableMarginM={availableMarginM}
          months={months}
        />
      </main>
    </div>
  );
}
