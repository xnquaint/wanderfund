'use strict';

const currencyService = require('../services/currencyService');

exports.fetchAllCurrencies = async (req, res) => {
  try {
    const result = await currencyService.getAllCurrencies();

    if (result.error) {
      return res.status(result.statusCode || 500).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Список валют успішно отримано.',
      count: result.currencies.length,
      currencies: result.currencies,
    });
  } catch (error) {
    console.error('Помилка в контролері валют:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні валют.' });
  }
};