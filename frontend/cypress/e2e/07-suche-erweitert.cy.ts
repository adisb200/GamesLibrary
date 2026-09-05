/// <reference types="cypress" />

/**
 * E2E-Tests: Erweiterte Suche (Edge Cases)
 *
 * Nutzer:innen tippen in Suchfelder oft Dinge, die Entwickler:innen
 * nicht erwarten: Sonderzeichen, sehr lange Copy-Paste-Strings oder
 * einfach schnelles Tippen ohne bewusstes Abschicken. Diese Tests
 * stellen sicher, dass die Suche in solchen Fällen weder abstürzt
 * noch hängen bleibt, und dass sie sich so verhält, wie die UI es
 * verspricht: Suche erst nach explizitem Abschicken (Button/Enter),
 * nicht bei jedem Tastendruck.
 */
describe('Suche mit Sonderfällen', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('stürzt bei Sonderzeichen und Umlauten nicht ab und zeigt Treffer oder "No Games Found"', () => {
    const searchTerm = '%<&"\'ÄÖÜäöüß';

    cy.intercept('GET', '/api/games/search*').as('search');
    cy.get('.search-bar__input').type(searchTerm, { parseSpecialCharSequences: false });
    cy.get('.search-bar__button').click();
    cy.wait('@search').its('response.statusCode').should('be.oneOf', [200]);

    // App darf nicht abstürzen: entweder Treffer-Karten oder der "No Games Found"-Status
    cy.get('body').then(($body) => {
      const hasCards = $body.find('.game-card').length > 0;
      const hasNoResults = $body.find('.game-list__status-title').length > 0;
      expect(hasCards || hasNoResults, 'Treffer oder "No Games Found" wird angezeigt').to.be.true;
    });
    if (Cypress.$('.game-list__status-title').length) {
      cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
    }
  });

  it('stürzt bei einem sehr langen Suchbegriff (> 200 Zeichen) nicht ab und lässt keinen Request hängen', () => {
    const longTerm = 'a'.repeat(250);

    cy.intercept('GET', '/api/games/search*').as('search');
    // React-kontrollierte Inputs benötigen echte Tastatur-Events (kein invoke('val')),
    // sonst bleibt der interne React-State leer und der Klick löst keine Suche aus.
    cy.get('.search-bar__input').type(longTerm, { delay: 0 });
    cy.get('.search-bar__button').click();

    // Request darf nicht hängen bleiben: er muss innerhalb des Timeouts abschliessen
    cy.wait('@search', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200]);

    cy.get('body').then(($body) => {
      const hasCards = $body.find('.game-card').length > 0;
      const hasNoResults = $body.find('.game-list__status-title').length > 0;
      expect(hasCards || hasNoResults, 'Treffer oder "No Games Found" wird angezeigt').to.be.true;
    });
  });

  it('löst die Suche NICHT bei jedem Tastendruck aus, sondern erst per Button/Enter', () => {
    let searchRequestFired = false;
    cy.intercept('GET', '/api/games/search*', () => {
      searchRequestFired = true;
    }).as('search');

    cy.get('.search-bar__input').type('Zel').then(() => {
      // Nach reinem Tippen (ohne Submit) darf noch kein Such-Request gefeuert worden sein
      expect(searchRequestFired, 'kein Suchrequest direkt nach dem Tippen').to.be.false;
    });
    cy.wait(300);
    cy.get('@search.all').should('have.length', 0);

    // Erst der Klick auf den Such-Button löst den Request tatsächlich aus
    cy.get('.search-bar__button').click();
    cy.wait('@search');
    cy.get('@search.all').should('have.length', 1);
  });
});
