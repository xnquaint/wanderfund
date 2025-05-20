'use strict';

const categoryService = require('../services/categoryService');

exports.fetchAllCategories = async (req, res) => {
  try {
    const result = await categoryService.getAllCategories();

    if (result.error) {
      return res.status(result.statusCode || 500).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Список категорій успішно отримано.',
      count: result.categories.length,
      categories: result.categories,
    });
  } catch (error) {
    console.error('Помилка в контролері категорій:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні категорій.' });
  }
};
