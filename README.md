![CI](https://github.com/adisb200/GamesLibrary/actions/workflows/ci.yml/badge.svg?branch=main)

# Auftrag: Testing der GamesLibrary-Applikation

## Ausgangslage

Die **GamesLibrary** ist eine Fullstack-Applikation zur Verwaltung einer persönlichen
Spielesammlung. Sie besteht aus zwei Teilen:

| Teil | Technologie | Verzeichnis |
|---|---|---|
| Backend | Spring Boot 4 (Java), REST-API, H2-In-Memory-Datenbank | `backend/` |
| Frontend | React 19 mit TypeScript | `frontend/` |

**Funktionsumfang:**
- Spiele anzeigen, erstellen, bearbeiten und löschen (CRUD über `/api/games`)
- Volltextsuche nach Titel (`GET /api/games/search?title=...`)
- Sortierung der Liste nach Erscheinungsdatum
- Import von Spieldaten via Steam-Suche (Backend als Proxy zur Steam Store API unter `/api/steam/**`)
- Validierung: Titel ist Pflichtfeld, Erscheinungsdatum ist Pflichtfeld und darf nicht in der Zukunft liegen

Im Ordner `frontend/cypress/` findet ihr bereits ein **Grundgerüst mit End-to-End-Tests**
(Cypress). Schaut euch diese Tests zuerst an und führt sie aus – sie zeigen euch,
wie die Applikation aufgebaut ist und wie man UI-Tests strukturiert.

Dieser Auftrag baut direkt auf der Präsentation **"Einführung ins Testing"** auf, die wir
gemeinsam im Detail besprochen haben. Ihr wendet die dort vorgestellten Testarten nun
praktisch auf ein reales, kleines Projekt an.

## Lernziele

Nach Abschluss dieses Auftrags könnt ihr:

- Unit-, Integrations-, System- und Akzeptanztests unterscheiden und selbständig schreiben
- eure Tests korrekt in den Box-Ansatz einordnen (White-, Black-, Grey-Box) und begründen
- Tests nach Testziel klassifizieren (Smoke, Regression, Performance, Usability, Accessibility, Security)
- passende Werkzeuge für Backend- und Frontend-Tests einsetzen (JUnit 5, Mockito, MockMvc, Cypress)
- die Ergebnisse eurer Tests nachvollziehbar dokumentieren

## Voraussetzungen / Setup

Startet beide Server, bevor ihr Integrations- oder E2E-Tests ausführt:

```bash
# Terminal 1 – Backend (läuft auf http://localhost:8080)
cd backend
./mvnw spring-boot:run

# Terminal 2 – Frontend (läuft auf http://localhost:3000)
cd frontend
npm install
npm start

# Terminal 3 – Cypress interaktiv öffnen
cd frontend
npm run cypress:open
```

Backend-Unit- und Integrationstests führt ihr mit folgendem Befehl aus (Backend muss dafür
**nicht** manuell gestartet sein, Spring Boot Test startet einen eigenen Testkontext):

```bash
cd backend
./mvnw test
```

## Aufgabenübersicht

| # | Testart (aus der Präsentation) | Box-Ansatz | Ort im Repo |
|---|---|---|---|
| 1 | Unit Tests | White-Box | `backend/src/test/java/.../service/GameServiceTest.java` |
| 2 | Integration Tests | White-Box | `backend/src/test/java/.../controller/GameControllerIT.java` |
| 3 | System Tests (E2E) | White-/Grey-Box | `frontend/cypress/e2e/` |
| 4 | Smoke Test | White-Box | `frontend/cypress/e2e/00-smoke.cy.ts` |
| 5 | Regressionstest | – | ganze bestehende Testsuite |
| 6 | Security Test | Grey-/Black-Box | `backend/src/test/java/.../security/` oder Cypress |
| 7 | Usability & Accessibility Test | Black-Box (manuell) | `TESTREPORT.md` |
| 8 | Performance Test (Bonus) | Black-Box | `TESTREPORT.md` |
| 9 | Klassifikation & Reflexion | – | `TESTREPORT.md` |

---

## Teil 1 – Unit Tests (Backend)

**Ziel:** Testet die Klasse `GameService` **isoliert**, d.h. ohne echte Datenbank. Mockt dazu
das `GameRepository` mit Mockito (`@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`).

Erstellt die Datei `backend/src/test/java/ch/diethelm/backend/service/GameServiceTest.java`
und deckt mindestens folgende Fälle ab:

- `getAllGames()` gibt die Liste zurück, die das Repository liefert
- `getGameById(id)` gibt das Spiel zurück, wenn es existiert
- `getGameById(id)` wirft eine `NoSuchElementException`, wenn keine ID gefunden wird
- `createGame(game)` ruft `repository.save(...)` auf und gibt das gespeicherte Spiel zurück
- `updateGame(id, game)` überschreibt **alle** Felder des bestehenden Spiels korrekt
- `updateGame(id, game)` wirft eine Exception, wenn die ID nicht existiert
- `deleteGame(id)` löscht das Spiel, wenn es existiert
- `deleteGame(id)` wirft eine Exception, wenn die ID nicht existiert
- `searchByTitle(title)` delegiert korrekt an `findByTitleContainingIgnoreCase(...)`

> **Hinweis:** Da ihr die interne Struktur des Codes kennt und gezielt einzelne Methoden mit
> präparierten Mock-Rückgabewerten testet, sind das **White-Box Unit Tests**.

## Teil 2 – Integrationstests (Backend)

**Ziel:** Testet das Zusammenspiel von `GameController`, `GameService`, `GameRepository`
und der echten H2-Datenbank. Verwendet `@SpringBootTest` zusammen mit `MockMvc`
(`@AutoConfigureMockMvc`), damit echte HTTP-Requests gegen die Applikation laufen.

Erstellt die Datei `backend/src/test/java/ch/diethelm/backend/controller/GameControllerIT.java`
und deckt mindestens folgende Fälle ab:

- `POST /api/games` mit gültigen Daten → Status `201 Created`, Response enthält generierte ID
- `POST /api/games` **ohne Titel** → Status `400 Bad Request` mit Validierungsdetail zum Feld `title`
- `POST /api/games` mit **Erscheinungsdatum in der Zukunft** → Status `400 Bad Request`
- `GET /api/games/{id}` mit nicht existierender ID → Status `404 Not Found`
- `GET /api/games/search?title=...` findet Treffer unabhängig von Gross-/Kleinschreibung
- `PUT /api/games/{id}` aktualisiert einen bestehenden Datensatz und die Änderung ist danach
  über `GET /api/games/{id}` sichtbar
- `DELETE /api/games/{id}` entfernt den Datensatz; ein zweiter Löschversuch liefert `404`

> **Hinweis:** Der `GlobalExceptionHandler` ist bereits für euch implementiert und liefert
> strukturierte Fehlerantworten (`timestamp`, `status`, `error`, `details`/`message`).
> Prüft in euren Tests gezielt diese Felder.

## Teil 3 – System-/End-to-End-Tests (Frontend, Cypress)

Im Ordner `frontend/cypress/e2e/` liegt bereits eine Testsuite, die den kompletten
Klick-Workflow der Applikation abdeckt (Liste anzeigen, Suchen, Sortieren, Formularvalidierung,
CRUD, Steam-Import). Führt diese Suite zuerst aus (`npm run cypress:open`) und lest euch die
Tests durch.

**Eure Aufgabe:** Ergänzt **mindestens drei eigene** E2E-Testfälle in einer neuen Datei
`frontend/cypress/e2e/07-eigene-tests.cy.ts`, die noch nicht abgedeckte Szenarien prüfen, z. B.:

- Suche mit Sonderzeichen oder sehr langem Suchbegriff
- Bearbeiten eines Spiels abbrechen (Cancel) → Originaldaten bleiben unverändert in der Liste
- Ein simulierter Serverfehler (`cy.intercept` mit Status `500` auf `GET /api/games`) → die
  Fehlermeldung in der UI wird korrekt angezeigt
- Verhalten bei einem ungültigen Bild-URL (`onError`-Fallback auf "No Image")

## Teil 4 – Smoke Test

**Ziel:** Ein Smoke Test prüft nur die grundlegendste Funktionalität – "läuft die Applikation
überhaupt?". Erstellt `frontend/cypress/e2e/00-smoke.cy.ts` mit einem einzigen, sehr schnellen
Test, der sicherstellt, dass:

- die Startseite lädt (`GET /`)
- das Backend erreichbar ist (`GET /api/games` antwortet mit Status `200`)
- der Titel "Games Library" sichtbar ist

## Teil 5 – Regressionstest

Ein Regressionstest stellt sicher, dass eine Änderung an einer Stelle keine bestehende
Funktionalität an anderer Stelle kaputt macht.

**Aufgabe:**
1. Führt vor jeder Änderung eure komplette Testsuite aus (Backend: `./mvnw test`,
   Frontend: `npm run cypress:run`) und haltet das Ergebnis fest (z. B. "22/22 Tests grün").
2. Nehmt anschliessend eine kleine, von der Lehrperson zugewiesene oder selbst gewählte
   Änderung am Code vor (z. B. eine Anpassung der Validierungsregel für das Erscheinungsdatum).
3. Führt die gesamte Testsuite erneut aus. Dokumentiert in `TESTREPORT.md`:
   - Welche Tests (falls überhaupt) sind neu fehlgeschlagen?
   - War das Fehlschlagen erwartet (weil sich das Verhalten bewusst geändert hat) oder
     handelt es sich um eine echte Regression?
   - Was habt ihr angepasst, damit alle Tests wieder grün sind?

## Teil 6 – Security Test

Testet die Applikation gezielt auf einfache Sicherheitsprobleme:

- **XSS:** Legt über das Formular ein Spiel mit dem Titel `<script>alert(1)</script>` an.
  Prüft im Browser (Cypress oder manuell), ob der Text als reiner Text angezeigt wird oder
  ob er als HTML/Script ausgeführt wird. Dokumentiert, warum React hier standardmässig schützt.
- **Ungültige Eingaben an der API:** Schickt mit einem Tool eurer Wahl (z. B. `curl`, Postman
  oder ein Backend-Test) unerwartete Werte an `POST /api/games` (z. B. sehr lange Strings,
  fehlende Felder, falsches JSON) und prüft, dass die API sauber mit `400` statt mit einem
  Absturz (`500`) reagiert.
- **CORS:** Prüft in `backend/src/main/java/.../config/CorsConfig.java`, welche Origin erlaubt
  ist. Versucht (z. B. mit `curl -H "Origin: http://böse-seite.ch"`), ob Anfragen von einer
  nicht erlaubten Origin abgelehnt werden.

> **Hinweis:** Diese Tests sind teilweise Grey-Box (ihr kennt die Konfiguration und testet
> gezielt dagegen), teilweise Black-Box (ihr testet nur über die Schnittstelle, ohne den
> Code zu verändern).

## Teil 7 – Usability- und Accessibility-Test

Diese Testarten lassen sich **nicht automatisieren** und benötigen menschliche Interaktion.

**Usability-Test:**
Bittet eine Mitschülerin/einen Mitschüler, die App **ohne Erklärung** zu bedienen, während ihr
zuschaut. Gebt folgende Aufgaben:
1. "Füge ein neues Spiel hinzu."
2. "Suche nach einem bestimmten Spiel."
3. "Sortiere die Liste nach dem neuesten Erscheinungsdatum."
4. "Lösche ein Spiel wieder."

Protokolliert in `TESTREPORT.md`: Wo zögert die Person? Welche Beschriftung/Icon wird
missverstanden? Welche Verbesserung würdet ihr vorschlagen?

**Accessibility-Test:**
Prüft manuell (z. B. mit reiner Tastaturbedienung, Tab-Taste):
- Ist das Formular (`GameForm`) vollständig ohne Maus bedienbar?
- Haben alle Bilder (`GameCard`) ein sinnvolles `alt`-Attribut?
- Haben reine Icon-Buttons (z. B. der Schliessen-Button `X` im Formular) ein zugängliches
  Label (`aria-label`) für Screenreader?
- Ist der Kontrast von Text zu Hintergrund ausreichend (Sichtprüfung genügt)?

Haltet eure Beobachtungen mit konkreten Datei-/Zeilenangaben in `TESTREPORT.md` fest.

## Teil 8 – Performance Test (Bonus, freiwillig)

Falls ihr Zeit habt: Messt mit einem Tool eurer Wahl (z. B. Browser-Devtools "Network", oder
ein einfaches Skript mit mehrfachen `curl`-Aufrufen) die Antwortzeit von `GET /api/games`.
Erweitert `data.sql` testweise um deutlich mehr Einträge und vergleicht die Antwortzeit vorher/
nachher. Haltet eure Messwerte kurz fest.

## Teil 9 – Klassifikation & Reflexion

Erstellt am Projekt-Root die Datei `TESTREPORT.md` mit folgendem Inhalt:

1. **Tabelle aller von euch geschriebenen Tests** mit Spalten: Testname, Testart
   (Unit/Integration/System/Smoke/Regression/Security), Box-Ansatz (White/Black/Grey) und
   einer kurzen Begründung für die Einordnung in den Box-Ansatz.
2. Ergebnisse aus Teil 5 (Regressionstest-Protokoll).
3. Ergebnisse aus Teil 6 (Security-Beobachtungen).
4. Ergebnisse aus Teil 7 (Usability- und Accessibility-Protokoll).
5. Optional: Ergebnisse aus Teil 8 (Performance).

---

## Abgabe

Reicht folgende Artefakte ein (z. B. als Pull Request oder Zip):

- `backend/src/test/java/ch/diethelm/backend/service/GameServiceTest.java`
- `backend/src/test/java/ch/diethelm/backend/controller/GameControllerIT.java`
- `frontend/cypress/e2e/00-smoke.cy.ts`
- `frontend/cypress/e2e/07-eigene-tests.cy.ts`
- `TESTREPORT.md`

**Alle bestehenden und neuen Tests müssen beim Abgabezeitpunkt erfolgreich durchlaufen**
(`./mvnw test` und `npm run cypress:run` liefern keine Fehler).

## Bewertungskriterien

| Kriterium | Gewichtung |
|---|---|
| Korrektheit und Vollständigkeit der Unit- und Integrationstests | 30% |
| Sinnvolle, eigenständige Erweiterung der E2E-Tests | 20% |
| Qualität der Security-, Usability- und Accessibility-Untersuchung | 20% |
| Korrekte und begründete Klassifikation (Box-Ansatz, Testarten) | 20% |
| Nachvollziehbare Dokumentation im `TESTREPORT.md` | 10% |

---

*
