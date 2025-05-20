'use strict';

const transactionService = require('../services/transactionService');

exports.addTransactionToTrip = async (req, res) => {

  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const transactionData = {
      categoryId: req.body.categoryId,
      amount: req.body.amount,
      currencyId: req.body.currencyId,
      originalAmount: req.body.originalAmount,
      originalCurrencyId: req.body.originalCurrencyId,
      transactionDate: req.body.transactionDate || new Date(),
      description: req.body.description,
      location: req.body.location,
    };

    const result = await transactionService.createTransaction(userId, tripId, transactionData);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ message: result.message, details: result.details });
    }

    res.status(201).json({
      message: 'Транзакцію успішно додано.',
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Помилка в контролері addTransactionToTrip:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при додаванні транзакції.' });
  }
};

exports.getTransactionsForTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const result = await transactionService.getTransactionsByTripId(userId, tripId, req.query);

    if (result.error) {
      return res.status(result.statusCode || 404).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Список транзакцій успішно отримано.',
      count: result.transactions.length,
      transactions: result.transactions,
    });
  } catch (error) {
    console.error('Помилка в контролері getTransactionsForTrip:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні транзакцій.' });
  }
};


exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const transactionId = req.params.transactionId;
    const updateData = req.body;

    if (updateData.tripId || updateData.userId) {
      delete updateData.tripId;
      delete updateData.userId;
    }

    const result = await transactionService.updateUserTransaction(userId, tripId, transactionId, updateData);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ message: result.message, details: result.details });
    }

    res.status(200).json({
      message: 'Транзакцію успішно оновлено.',
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Помилка в контролері updateTransaction:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при оновленні транзакції.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const transactionId = req.params.transactionId;

    const result = await transactionService.deleteUserTransaction(userId, tripId, transactionId);

    if (result.error) {
      return res.status(result.statusCode || 404).json({ message: result.message });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Помилка в контролері deleteTransaction:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при видаленні транзакції.' });
  }
};
