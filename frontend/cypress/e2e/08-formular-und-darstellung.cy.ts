/// <reference types="cypress" />

/**
 * E2E-Tests: Formularverhalten & Darstellung
 *
 * Diese Tests decken Fälle ab, in denen die UI dem Nutzer/der
 * Nutzerin etwas verspricht, das leicht kaputtgehen kann: dass ein
 * abgebrochener Edit-Vorgang wirklich nichts verändert, dass kaputte
 * Bild-URLs nicht als kaputtes <img> im DOM hängen bleiben, sondern
 * sauber durch einen "No Image"-Platzhalter ersetzt werden, und dass
 * sich das Formular auch ohne Maus bedienen lässt.
 */
describe('Bearbeiten abbrechen und Bild-Fallback', () => {
  const uniqueSuffix = () => Date.now().toString();

  beforeEach(() => {
    cy.visitApp();
  });

  afterEach(() => {
    cy.get('body').then(($body) => {
      if ($body.find('.game-form__close').length) {
        cy.get('.game-form__close').click();
      }
    });
  });

  it('behält beim Abbrechen des Edit-Modus die Originaldaten des Spiels unverändert bei', () => {
    const suffix = uniqueSuffix();
    const originalTitle = `Cypress Cancel Original ${suffix}`;
    const originalDescription = `Original-Beschreibung ${suffix}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title: originalTitle,
      description: originalDescription,
      releaseDate: '2018-05-20',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__btn--edit').click();
    });
    cy.get('.game-form__title').should('contain.text', 'Edit Game');
    cy.get('.game-form input[name="title"]').should('have.value', originalTitle);

    // Werte im Formular ändern, aber NICHT speichern
    cy.fillGameForm({
      title: `${originalTitle} GEÄNDERT`,
      description: 'Diese Änderung darf nie gespeichert werden',
    });
    cy.get('.game-form__btn--cancel').click();
    cy.get('.game-form').should('not.exist');

    // Gezielt prüfen: Titel/Beschreibung entsprechen exakt den Werten vor dem Öffnen
    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__title').should('have.text', originalTitle);
      cy.get('.game-card__description').should('have.text', originalDescription);
    });
    cy.contains('.game-card__title', `${originalTitle} GEÄNDERT`).should('not.exist');

    cy.deleteGameByTitle(originalTitle);
  });

  it('zeigt nach fehlgeschlagenem Laden einer kaputten Bild-URL "No Image" ohne kaputtes <img>-Element', () => {
    const title = `Cypress Kaputtes Bild ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      imageUrl: 'https://this-domain-does-not-exist-cypress-test.invalid/broken.jpg',
      releaseDate: '2017-09-01',
    });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', title).within(() => {
      // Der onError-Fallback ersetzt das <img> asynchron, daher grosszügiges Timeout
      cy.get('.game-card__no-image', { timeout: 10000 }).should('be.visible');
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('.game-card__image').should('not.exist');
    });

    cy.deleteGameByTitle(title);
  });

  it('zeigt "No Image" an, wenn beim Anlegen gar keine Bild-URL angegeben wurde', () => {
    const title = `Cypress Ohne Bild ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({ title, releaseDate: '2016-02-14' });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('be.visible');
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('.game-card__image').should('not.exist');
    });

    cy.deleteGameByTitle(title);
  });

  it('BONUS: lässt sich das Formular per Tastatur bedienen (Fokus-Reihenfolge, Submit per Enter)', () => {
    const title = `Cypress Tastatur ${uniqueSuffix()}`;

    cy.openAddGameForm();

    // Gezieltes Fokus-Management statt echtem Tab-Keypress (kein Browser-natives
    // Tab-Verhalten in Cypress ohne zusätzliches Plugin): da im Formular keine
    // expliziten tabindex-Überschreibungen gesetzt sind, entspricht die DOM-
    // Reihenfolge der tatsächlichen Tab-Reihenfolge im Browser.
    cy.get('.game-form input[name="title"]').focus().should('be.focused').type(title);
    cy.get('.game-form textarea[name="description"]').focus().should('be.focused').type('Per Tastatur ausgefüllt');
    cy.get('.game-form input[name="imageUrl"]').focus().should('be.focused');
    cy.get('.game-form input[name="releaseDate"]').focus().should('be.focused').type('2015-07-04');

    cy.get('.game-form input, .game-form textarea, .game-form button').then(($els) => {
      const names = $els.toArray().map((el) => el.getAttribute('name') || el.className);
      expect(names.indexOf('title')).to.be.lessThan(names.indexOf('description'));
      expect(names.indexOf('description')).to.be.lessThan(names.indexOf('imageUrl'));
      expect(names.indexOf('imageUrl')).to.be.lessThan(names.indexOf('releaseDate'));
    });

    cy.intercept('POST', '/api/games').as('createGame');
    // Submit per Enter statt Mausklick auf den Submit-Button. Date-Inputs akzeptieren
    // in Cypress keine Sondertasten-Sequenzen wie {enter}, daher auf dem Titelfeld ausgelöst.
    cy.get('.game-form input[name="title"]').type('{enter}');
    cy.wait('@createGame');

    cy.get('.game-form').should('not.exist');
    cy.contains('.game-card__title', title).should('be.visible');

    cy.deleteGameByTitle(title);
  });
});
