'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('categories', [
      { name: 'Харчування', parent_id: null, created_at: now, updated_at: now },
      { name: 'Проживання', parent_id: null, created_at: now, updated_at: now },
      { name: 'Транспорт', parent_id: null, created_at: now, updated_at: now },
      { name: 'Розваги', parent_id: null, created_at: now, updated_at: now },
      { name: 'Покупки', parent_id: null, created_at: now, updated_at: now },
      { name: 'Зв\'язок', parent_id: null, created_at: now, updated_at: now },
      { name: 'Медицина', parent_id: null, created_at: now, updated_at: now },
      { name: 'Інше', parent_id: null, created_at: now, updated_at: now },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
