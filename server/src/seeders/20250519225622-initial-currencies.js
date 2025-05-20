'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('currencies', [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        created_at: now,
        updated_at: now,
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        created_at: now,
        updated_at: now,
      },
      {
        code: 'UAH',
        name: 'Ukrainian Hryvnia',
        symbol: '₴',
        created_at: now,
        updated_at: now,
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        created_at: now,
        updated_at: now,
      },
      {
        code: 'PLN',
        name: 'Polish Zloty',
        symbol: 'zł',
        created_at: now,
        updated_at: now,
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('currencies', null, {});
  }
};