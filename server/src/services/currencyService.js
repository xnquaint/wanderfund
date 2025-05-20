'use strict';

const { Currency } = require('../models'); // Імпортуємо модель Currency

exports.getAllCurrencies = async () => {
  try {
    const currencies = await Currency.findAll({
      order: [['name', 'ASC']],
    });

    if (!currencies) {
      return {
        error: true,
        statusCode: 404,
        message: 'Валюти не знайдено.',
      };
    }

    return {
      error: false,
      currencies,
    };
  } catch (error) {
    console.error('Сервісна помилка при отриманні валют:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося отримати список валют через внутрішню помилку.',
    };
  }
};