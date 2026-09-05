/// <reference types="cypress" />

/**
 * E2E-Tests: Fehlerbehandlung
 *
 * Backends fallen aus, Netzwerke sind instabil. Diese Tests simulieren
 * Server- und Netzwerkfehler in den zentralen Nutzer:innen-Workflows
 * (Laden, Suchen, Anlegen) und stellen sicher, dass die App dabei nie
 * einen leeren/kaputten Bildschirm zeigt, sondern immer eine sinnvolle
 * Fehlermeldung – und dass keine Daten fälschlich optimistisch
 * angezeigt werden, die es serverseitig nie gab.
 */
describe('Fehlerbehandlung bei Server- und Netzwerkfehlern', () => {
  const uniqueSuffix = () => Date.now().toString();

  afterEach(() => {
    cy.get('body').then(($body) => {
      if ($body.find('.game-form__close').length) {
        cy.get('.game-form__close').click();
      }
    });
  });

  it('zeigt beim initialen Laden eine Fehlermeldung, wenn GET /api/games mit 500 antwortet', () => {
    cy.intercept('GET', '/api/games', { statusCode: 500, body: { message: 'Internal Server Error' } }).as('getGamesFail');
    cy.visit('/');
    cy.wait('@getGamesFail');

    cy.get('.home-page__error', { timeout: 10000 }).should('be.visible');
    cy.get('.home-page__error').should('contain.text', 'Fehler beim Laden der Spiele.');
  });

  it('zeigt bei einer Suche eine Fehlermeldung, wenn GET /api/games/search mit 500 antwortet', () => {
    cy.visitApp();

    cy.intercept('GET', '/api/games/search*', { statusCode: 500, body: { message: 'Internal Server Error' } }).as('searchFail');
    cy.get('.search-bar__input').type('irgendein Begriff');
    cy.get('.search-bar__button').click();
    cy.wait('@searchFail');

    cy.get('.home-page__error', { timeout: 10000 }).should('be.visible');
    cy.get('.home-page__error').should('contain.text', 'Fehler bei der Suche.');
  });

  it('zeigt bei einem Netzwerkfehler beim Erstellen eine Fehlermeldung und fügt das Spiel nicht optimistisch zur Liste hinzu', () => {
    cy.visitApp();

    const title = `Cypress Netzwerkfehler ${uniqueSuffix()}`;

    cy.intercept('POST', '/api/games', { forceNetworkError: true }).as('createGameFail');
    cy.openAddGameForm();
    cy.fillGameForm({ title, releaseDate: '2020-04-01' });
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGameFail');

    // Ist-Zustand der App (Stand heute, siehe useGames.ts addGame/handleFormSubmit):
    // handleFormSubmit `await`et addGame(), das seinen eigenen Fehler intern fängt
    // und NIE erneut wirft. Dadurch läuft `setShowForm(false)` danach IMMER,
    // egal ob der Request erfolgreich war oder fehlgeschlagen ist. Das Formular
    // schliesst sich also trotz Fehler automatisch (kein "offen bleiben bei Fehler"-
    // Verhalten) – das ist die Grundlage für die Fehlerdiskussion in Teil 5/6.
    cy.get('.game-form').should('not.exist');

    cy.get('.home-page__error', { timeout: 10000 }).should('be.visible');
    cy.get('.home-page__error').should('contain.text', 'Fehler beim Erstellen des Spiels.');

    // Keine optimistische Anzeige: das Spiel darf trotz des UI-Requests nicht auftauchen
    cy.contains('.game-card__title', title).should('not.exist');

    // Aufräumen zur Sicherheit, falls das Spiel entgegen der Erwartung doch angelegt wurde
    cy.deleteGameByTitle(title);
  });

  it('BONUS: zeigt während einer sehr langsamen Antwort einen Lade-/Wartezustand an', () => {
    cy.intercept('GET', '/api/games', (req) => {
      req.reply((res) => {
        res.setDelay(3000);
      });
    }).as('slowGetGames');
    cy.visit('/');

    // Während der Request noch läuft, muss der Ladezustand sichtbar sein
    cy.get('.game-list__spinner').should('be.visible');
    cy.get('.game-list__status-title').should('contain.text', 'Loading Library...');

    cy.wait('@slowGetGames');
    cy.get('.game-list__spinner').should('not.exist');
  });
});
