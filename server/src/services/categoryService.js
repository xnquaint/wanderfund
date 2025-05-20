'use strict';

const { Category } = require('../models');

exports.getAllCategories = async () => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });

    return {
      error: false,
      categories: categories.map(cat => cat.toJSON()),
    };
  } catch (error) {
    console.error('Сервісна помилка при отриманні категорій:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося отримати список категорій через внутрішню помилку.',
    };
  }
};
