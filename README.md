# CADe SIMU Next ⚡

Un simulatore ed editor di schemi elettrici industriale e didattico moderno, fluido e leggero, progettato per superare tutti i limiti e l'instabilità del CADe_SIMU originale. Realizzato con **React 18**, **TypeScript** e **Vite**.

---

## 🚀 Caratteristiche Principali

1. **Passaggio Istantaneo da Formato A4 ad A3 (e A2)**:
   - Selezionabile al volo dal menu a tendina nella barra superiore (*"Foglio: A4 / A3 / Orizzontale / Verticale"*).
   - Il cartiglio normato CEI/IEC 60617 / ISO 7200 si riposiziona e ridimensiona automaticamente nell'angolo in basso a destra con dati di progetto, revisione, autore e data.

2. **Nuova Barra "Cavi & Connessioni" con Cursore a Croce**:
   - Palette orizzontale dedicata per tutti i tipi di conduttori normati:
     - **Fase (L)** (Marrone `#9a3412`)
     - **Neutro (N)** (Blu `#2563eb`)
     - **Terra (PE)** (Tratteggiato Giallo/Verde `#16a34a`)
     - **Positivo (+)** (Rosso `#ef4444`, 24V DC)
     - **Negativo (-)** (Nero `#0f172a`, 0V DC)
     - **Comando** (Grigio scuro `#475569`, ausiliario)
     - **3F Vert (|||)** e **3F Orizz (≡)** (Fasci trifase a passo normato 20px).
   - Cursore a croce interattivo durante il tracciamento e disattivazione immediata con il tasto **`Esc`**.

3. **Manipolazione Avanzata dei Cavi & Conduttori**:
   - Selezione individuale del cavo con un solo click (secondo click per rilasciare).
   - Spostamento dell'intero filo trascinandolo.
   - Allungamento e accorciamento trascinando i morsetti/pallini terminali di estremità.

4. **Selezione Rettangolare (Box Marquee) & Spostamento Sezioni**:
   - Trascina il mouse su un'area libera per circondare un'intera sezione di schema.
   - Tutti i componenti e conduttori circondati vengono selezionati all'unisono.
   - Puoi afferrare la selezione e spostare l'intera sezione dove preferisci.

5. **Copia, Taglia, Incolla Fluttuante & Cancellazione di Gruppo**:
   - Scorciatoie standard **`Ctrl+C`**, **`Ctrl+V`**, **`Ctrl+X`** e menu contestuale con il tasto destro.
   - **Incolla Fluttuante**: quando incolli una sezione, questa si aggancia al cursore del mouse; basta muovere il mouse e fare un click per fissarla nella nuova posizione.
   - Cancellazione istantanea di gruppi selezionati premendo il tasto **`Canc`** (o `Backspace`).

6. **Stampa Vettoriale & Esportazione PDF Conforme a Standard**:
   - Pulsante dedicato **`Stampa`** e scorciatoia **`Ctrl+P`**.
   - Genera una tavola tecnica vettoriale pulita, centrata e a piena pagina, escludendo l'interfaccia dell'applicazione e includendo cornici, riferimenti a reticolo e cartiglio.
   - Adattamento automatico di `@page` al formato e orientamento del foglio (A4/A3/A2, landscape/portrait).

7. **Motore di Simulazione Elettrica in Tempo Reale**:
   - Risoluzione dei potenziali di linea (Fase L, Neutro N, Terra PE, Trifase L1-L2-L3, 24V DC / 0V).
   - Evidenziazione dinamica dei conduttori in tensione.
   - Interblocco reale dei sezionatori/magnetotermici (es. `-QM1` parte aperto e non alimenta il motore finché non viene chiuso).
   - Accoppiamento tra bobine e contatti ausiliari/potenza tramite la sigla **Tag** (es. `-KM1`).
   - Circuito di autoritenuta marcia/arresto perfettamente simulato.
   - Rotore animato per i motori asincroni trifase durante la rotazione.

8. **Componenti Extensibili in JSON & Interfaccia Moderna**:
   - Icone ampie e leggibili, ricerca istantanea e filtri per categoria.
   - Possibilità di aggiungere nuovi componenti personalizzati al volo tramite JSON.
   - Undo e Redo illimitati (`Ctrl+Z`, `Ctrl+Y`).

---

## 🛠️ Come Avviare l'Applicazione

### Metodo 1: Doppio Click (Windows)
Fai doppio click sul file:
```
avvia_cadesimu_next.bat
```
Si aprirà automaticamente il browser all'indirizzo `http://localhost:5173/`.

### Metodo 2: Da Terminale
```bash
npm install
npm run dev
```

### Esecuzione Test
```bash
npm test
```

### Compilazione di Produzione
```bash
npm run build
```

---

## 📋 Struttura del Progetto

- `src/model/types.ts`: Modello dati JSON-serializzabile (ComponentDef, Primitives, Behavior, Element, Wire, WireKind, Sheet).
- `src/library/standard.ts`: Libreria dei componenti normati (Alimentazioni, Protezioni, Comando, Contatti, Bobine, Motori, Lampade).
- `src/library/registry.ts`: Registro componenti con supporto per import/export JSON dinamico.
- `src/engine/simulation.ts`: Motore di simulazione del circuito elettrico (nodi equipotenziali, commutazione contatti, carichi, motori).
- `src/editor/Renderer.tsx`: Motore di rendering vettoriale SVG con supporto cartiglio A4/A3 e feedback grafico in tempo reale.
- `src/editor/SchematicCanvas.tsx`: Canvas interattivo (pan, zoom, tracciamento cavi, selezione box, spostamento gruppi, incolla fluttuante).
- `src/ui/Toolbar.tsx`: Barra comandi superiore (formato foglio, simulazione, file JSON, stampa PDF, undo/redo).
- `src/ui/WireToolbar.tsx`: Barra dedicata ai cavi e connessioni con colori normati.
- `src/ui/ComponentPalette.tsx`: Palette componenti con icone grandi e gestione componenti JSON.
- `src/ui/PropertiesPanel.tsx`: Scheda laterale con ispezione singola o selezione multipla.
- `src/ui/ContextMenu.tsx`: Menu contestuale del tasto destro (Copia, Incolla, Taglia, Elimina, Ruota, Parametri).
- `src/samples/directStart.ts`: Esempio pre-caricato di avviamento diretto marcia/arresto con autoritenuta e motore trifase.
