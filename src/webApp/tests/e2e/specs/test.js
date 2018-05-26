// https://docs.cypress.io/api/introduction/api.html

describe('Test', () => {
  it('Cannot connect to node', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: 'http://localhost:8545/',
      status: 500,
      response: ''
    });
    cy.visit('/');
    cy.get('#node-connect').contains('Node connection error');
    cy.server({ enable: false });
  });

  describe('Create new human', () => {

    it('Cannot create with invalid email', () => {
      cy.visit('/');
      cy.get('input').type('0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd');
      cy.get('#submission').should('be.visible');
      cy.get('#submission-form').should('be.visible');
      cy.get('#email').should('be.visible');
      cy.get('#month').select('1');
      cy.get('#day').select('20');
      cy.get('#year').select('1993');
      cy.get('#email').type('invalid email');
      cy.get('#submit').click();
      cy.get('#errors').should('be.visible');
      cy.get('#errors').contains('Bad parameters: "email" must be a valid email');
    });

    it('Cannot create with invalid email code', () => {
      cy.visit('/');
      cy.get('input').type('0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd');
      cy.get('#submission').should('be.visible');
      cy.get('#submission-form').should('be.visible');
      cy.get('#email').should('be.visible');
      cy.get('#month').select('1');
      cy.get('#day').select('20');
      cy.get('#year').select('1993');
      cy.get('#email').type('julesgoullee@gmail.com');
      cy.get('#submit').click();
      cy.get('#submission-oracle-form').should('be.visible');
      cy.get('#email-code').type('invalid code');
      cy.get('#submit-email-code').click();
      cy.get('#errors').contains('Bad parameters: "code" with value "invalid code" fails to match the required pattern');
      cy.get('#email-code').clear();
      cy.get('#email-code').type('10000000-0000-0000-0000-000000000000');
      cy.get('#submit-email-code').click();
      cy.get('#errors').contains('Not found params: {"code":"10000000-0000-0000-0000-000000000000"}');
    });

    it('Create new human', () => {
      cy.visit('/');
      cy.get('input').type('0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd');
      cy.get('#submission').should('be.visible');
      cy.get('#submission-form').should('be.visible');
      cy.get('#month').select('1');
      cy.get('#day').select('20');
      cy.get('#year').select('1993');
      cy.get('#email').type('julesgoullee@gmail.com');
      cy.get('#submit').click();
      cy.get('#email-code').should('be.visible');
      cy.get('#email-code').type('00000000-0000-0000-0000-000000000000');
      cy.get('#submit-email-code').click();
      cy.get('#submission').contains('Account is creating, Waiting for validation....');
      cy.wait(10000);
      cy.get('#wallet').contains('Address');
      cy.get('#wallet').contains('Birthday');
      cy.get('#wallet').contains('Hash:');
      cy.get('#wallet').contains('Created at');
      cy.get('#errors').should('not.exist');
      cy.get('#submission-waiting').should('not.exist');
    });

    it('Cannot create one once', () => {
      cy.visit('/');
      cy.get('input').type('0x6178070da216695c2c998ae3090b097f366a9e1dfeede89188957c410d107097');
      cy.get('#month').select('1');
      cy.get('#day').select('20');
      cy.get('#year').select('1993');
      cy.get('#email').type('julesgoullee@gmail.com');
      cy.get('#submit').click();
      cy.get('#email-code').type('00000000-0000-0000-0000-000000000000');
      cy.get('#submit-email-code').click();
      cy.get('#errors').contains('Humanist already exist');
      cy.get('#submission-form').should('be.visible');
    });

    it('Connect with validated human', () => {
      cy.visit('/');
      cy.get('input').type('0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd');
      cy.get('#wallet').contains('Address');
      cy.get('#wallet').contains('Birthday:');
      cy.get('#wallet').contains('Hash:');
      cy.get('#wallet').contains('Created at:');
      cy.get('#wallet').contains('Validate: true');
      cy.get('#wallet').contains('Balance:');
      cy.get('#errors').should('not.exist');
    });

  });

  describe('With humanist', () => {

    before(() => {
      cy.visit('/');
      cy.get('input').type('0xb45d72990799ff01f5c9f87732bac7b8818163005b6552ea90973d1ed39a1cfa');
      cy.get('#month').select('1');
      cy.get('#day').select('20');
      cy.get('#year').select('1993');
      cy.get('#email').type('2@humanist.com');
      cy.get('#submit').click();
      cy.get('#email-code').should('be.visible');
      cy.get('#email-code').type('00000000-0000-0000-0000-000000000000');
      cy.get('#submit-email-code').click();
      cy.get('#submission').contains('Account is creating, Waiting for validation....');
      cy.wait(10000);
    });

    it('Should send', () => {
      cy.visit('/');
      cy.get('input').type('0xb45d72990799ff01f5c9f87732bac7b8818163005b6552ea90973d1ed39a1cfa');
      cy.get('#send-form').should('exist');
      cy.get('#send-address').type('0xf10B792aBDCaE52e149C32405Bd7658fc6236536');
      cy.get('#send-amount').type(0.1);
      cy.get('#send-submit').click();

      cy.get('#wallet').contains('BlockNumber:');
      cy.get('#wallet').contains('BlockHash:');
      cy.get('#wallet').contains('TransactionHash:');
      cy.get('#wallet').contains('Type:');
      cy.get('#wallet').contains('From:');
      cy.get('#wallet').contains('To:');
      cy.get('#wallet').contains('Amount:');
      cy.get('#wallet').contains('Fee:');
    });

  });

});
