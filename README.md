# PowerCad_NextGen ⚡

Un simulatore ed editor CAD di schemi elettrici industriali e didattici moderno, fluido e leggero. Sviluppato interamente da zero con **React 18**, **TypeScript**, **SVG vettoriale** e **Vite**.

---

## ⚖️ Dichiarazione di Indipendenza & Standard Normativi (Disclaimer)

> [!NOTE]
> **PowerCad_NextGen** è un progetto open-source indipendente, sviluppato per scopi formativi, professionali e didattici.
> - **Simbologia Normata:** Tutti i simboli elettrici, la numerazione dei morsetti (es. 1-2, 13-14, 21-22, A1-A2, X1-X2) e le logiche grafiche adottate sono rigorosamente conformi agli standard internazionali aperti **IEC 60617** (recepiti in Italia come **CEI EN 60617**) e **ISO 7200**.
> - **Indipendenza:** Il progetto trae ispirazione dall'usabilità dei classici simulatori didattici di automazione industriale per Windows degli anni 2000 (quali *CADe_SIMU* del Prof. Juan Luis Villanueva Montoto). Tuttavia, **non è in alcun modo affiliato, sponsorizzato né collegato a CADe_SIMU o ai suoi autori**. Il codice sorgente, l'architettura reattiva, il motore di risoluzione nodale e l'interfaccia utente sono stati progettati e scritti interamente ex-novo per il Web moderno.

---

## 🚀 Caratteristiche Principali

1. **Multipiattaforma al 100% (Windows, macOS, Linux, iPad/Tablet)**:
   - Funziona in qualsiasi browser web moderno ad alte prestazioni, senza dipendenze binarie né emulatori.

2. **Libreria Componenti Conforme a IEC 60617**:
   - **Alimentazioni:** Fonti monofase (L, N, PE), trifase (3L, 3L+N, 3L+PE, 3L+N+PE), corrente continua (+24V, 0V DC) e trasformatori.
   - **Protezioni:** Fusibili (monopolari, bipolari, tripolari, con sezionatore), interruttori magnetotermici (1P, 1P+N, 2P, 3P, 3P+N, 4P), differenziali e relè termici salvamotore.
   - **Contattori & Interruttori:** Sezionatori rotativi, contattori di potenza tripolari e quadripolari, invertitori di marcia.
   - **Comandi:** Pulsanti NO/NC, pulsanti a fungo d'emergenza con sgancio a rotazione, selettori a chiave e selettori rotativi a 2/3 posizioni stabili.
   - **Contatti Ausiliari & Temporizzati:** Contatti NO, NC, di scambio, temporizzati ritardati all'eccitazione (TON), alla diseccitazione (TOF) e contatti di relè termico (95-96 NC, 97-98 NO).
   - **Azionamenti & Detectors:** Pulsanti (NO, NC, NO+NC, in deviazione, a fungo, a tirante), selettori rotativi (1–4 posizioni), interruttori manuali a camme, finecorsa meccanici, contatti reed magnetici, pressostati, sensori di prossimità induttivi/capacitivi, fotocellule a barriera/riflessione e termostati.
   - **Bobine & Segnali:** Bobine standard per contattori (-KM), bobine bistabili a due impulsi (Set/Reset), teleruttori, elettrovalvole (-M / -EV), temporizzatori TON, TOF, ciclici/intermittenti, generatori d'impulsi, interruttori orari, contatori numerici d'impulsi, lampade spia a luce fissa e intermittente (con selezione colore), suonerie a campana, ronzatori/vibratori, sirene e clacson.
   - **Motori & Potenza:** Motori asincroni trifase (gabbia di scoiattolo, 6 morsetti Y/Δ, Dahlander, 2 velocità, rotore avvolto), motori monofase, motori DC, freni elettrici, attuatori lineari, resistori/autotrasformatori di avviamento, Soft Starter, Inverter (VFD) e azionamenti per motori DC e Passo-Passo.
   - **Logica & Attuatori Pneumatici (ISO 1219):** Porte logiche (AND, OR, NOT, XOR, NAND, NOR), Flip-Flop SR/T, temporizzatori/contatori logici, decoder/display 7 segmenti e preselettori BCD; cilindri pneumatici a semplice/doppio effetto, cilindri senza stelo (a canna scanalata e magnetici), attuatori rotativi a paletta, pinze pneumatiche, ventose con eiettore Venturi e motori pneumatici unidirezionali/bidirezionali.

3. **Motore di Simulazione Elettrica in Tempo Reale**:
   - Risoluzione dei potenziali di rete (Fase, Neutro, Terra, Trifase L1-L2-L3, DC).
   - Evidenziazione visiva e interattiva dei conduttori in tensione.
   - Interblocco reale dei contatti associati tramite tag (es. `-KM1`, `-KA1`, `-QM1`).
   - Simulazione temporizzata reale (secondi) con animazioni e lampeggio sincrono.

4. **Passaggio Istantaneo da Formato A4 ad A3 (e A2)**:
   - Selezionabile al volo dal menu a tendina (*"Foglio: A4 / A3 / Orizzontale / Verticale"*).
   - Cartiglio normato IEC 60617 / ISO 7200 auto-riposizionante con dati di progetto, revisione, autore e data.

5. **Palette Cavi & Connessioni Normata**:
   - Palette dedicata con tratteggio e colori convenzionali:
     - **Fase (L)** (Marrone `#9a3412`)
     - **Neutro (N)** (Blu `#2563eb`)
     - **Terra (PE)** (Giallo/Verde `#16a34a`)
     - **Positivo (+)** (Rosso `#ef4444`, 24V DC)
     - **Negativo (-)** (Nero `#0f172a`, 0V DC)
     - **Comando Ausiliario** (Grigio scuro `#475569`)
     - **Fasci Trifase (3F Vert / 3F Orizz)** a passo fisso 20px.

6. **Strumenti di Editing Avanzati**:
   - Selezione rettangolare (box marquee) per afferrare e spostare intere sezioni di schema.
   - Copia, Taglia, Incolla con modalità **Incolla Fluttuante** agganciata al mouse.
   - Annulla e Ripristina illimitati (`Ctrl+Z`, `Ctrl+Y`).
   - Stampa vettoriale pulita ad alta risoluzione o esportazione diretta in PDF (`Ctrl+P`).
   - Esportazione e importazione degli schemi in formato aperto JSON.

---

## 🛠️ Come Avviare l'Applicazione

### Su macOS e Linux
1. Clona il repository:
   ```bash
   git clone <URL_REPOSITORY>
   cd PowerCad_NextGen
   ```
2. Installa le dipendenze ed avvia il server di sviluppo:
   ```bash
   npm install
   npm run dev
   ```
3. Apri il browser all'indirizzo `http://localhost:5173/`.

### Su Windows
- **Metodo rapido:** Doppio click sul file `avvia_powercad.bat`.
- **Oppure da terminale PowerShell / Prompt:**
  ```bash
  npm install
  npm run dev
  ```

### Esecuzione Test Unitari
```bash
npm test
```

### Compilazione di Produzione
```bash
npm run build
```

---

## 🌐 Pubblicazione su GitHub Pages

Il progetto è configurato con percorsi relativi (`base: './'`) e include una GitHub Action automatica in `.github/workflows/deploy.yml`.
Il software è accessibile alla pagina:

https://davidedifilippo.github.io/PowerCad_NextGen/

## 👥 Autore & Contributors

- **Ing. Di Filippo** — Ideazione, progettazione ingegneristica e direzione dello sviluppo
- **Antigravity** — Ambiente di sviluppo agentico (*Agentic AI Development Environment*)
- **Gemini** — Modello AI di sviluppo (*AI Development Model*)

---

## 📄 Licenza

Rilasciato sotto licenza open-source [MIT](./LICENSE).

