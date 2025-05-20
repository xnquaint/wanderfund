'use strict';

const { Transaction, Trip, Category, Currency } = require('../models');
const { Op } = require('sequelize');
const analyticsService = require('./analyticsService');

exports.createTransaction = async (userId, tripId, transactionData) => {
  try {
    const trip = await Trip.findOne({ where: { id: tripId, userId: userId } });
    if (!trip) {
      return { error: true, statusCode: 404, message: 'Подорож не знайдено або у вас немає до неї доступу.' };
    }

    if (!transactionData.categoryId && transactionData.description) {
      console.log(`Attempting to auto-categorize transaction with description: "${transactionData.description}" for trip ${tripId}`);
      const predictedCategory = await analyticsService.autoCategorizeTransactionByDescription(transactionData.description);
      if (predictedCategory) {
        transactionData.categoryId = predictedCategory.id;
        console.log(`Predicted category for "${transactionData.description}": ID=${predictedCategory.id}, Name=${predictedCategory.name}`);
      } else {
        console.log(`Could not predict category automatically for "${transactionData.description}".`);
        const otherCategory = await Category.findOne({ where: { name: 'Інше' } });
        if (otherCategory) {
            transactionData.categoryId = otherCategory.id;
            console.log('Set category to "Інше" by default.');
        } else {
            return { error: true, statusCode: 400, message: 'Категорія транзакції є обов\'язковою, і не вдалося визначити її автоматично або знайти категорію "Інше".' };
        }
      }
    }

    if (!transactionData.categoryId) {
         return { error: true, statusCode: 400, message: 'Категорія транзакції є обов\'язковою.' };
    }
    const category = await Category.findByPk(transactionData.categoryId);
    if (!category) {
      return { error: true, statusCode: 400, message: `Категорію з ID ${transactionData.categoryId} не знайдено.` };
    }

    const currency = await Currency.findByPk(transactionData.currencyId);
    if (!currency) {
      return { error: true, statusCode: 400, message: `Валюту транзакції з ID ${transactionData.currencyId} не знайдено.` };
    }

    if (transactionData.originalCurrencyId) {
      const originalCurrency = await Currency.findByPk(transactionData.originalCurrencyId);
      if (!originalCurrency) {
        return { error: true, statusCode: 400, message: `Оригінальну валюту з ID ${transactionData.originalCurrencyId} не знайдено.` };
      }
    }

    const dataToCreate = { ...transactionData, tripId };
    const newTransaction = await Transaction.create(dataToCreate);

    const transactionWithDetails = await Transaction.findByPk(newTransaction.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'symbol'] },
        { model: Currency, as: 'originalCurrency', attributes: ['id', 'code', 'symbol'] },
      ]
    });

    return { error: false, transaction: transactionWithDetails.toJSON() };

  } catch (error) {
    console.error('Сервісна помилка при створенні транзакції:', error);
    if (error.name === 'SequelizeValidationError') {
      return {
        error: true,
        statusCode: 400,
        message: 'Помилка валідації даних для транзакції.',
        details: error.errors.map(e => ({ field: e.path, message: e.message })),
      };
    }
    return { error: true, statusCode: 500, message: 'Не вдалося створити транзакцію через внутрішню помилку.' };
  }
};

exports.getTransactionsByTripId = async (userId, tripId, queryParams = {}) => {
  try {
    const trip = await Trip.findOne({ where: { id: tripId, userId: userId } });
    if (!trip) {
      return {
        error: true,
        statusCode: 404,
        message: 'Подорож не знайдено або у вас немає до неї доступу.',
      };
    }

    const whereClause = { tripId: tripId };
    if (queryParams.categoryId) {
      whereClause.categoryId = queryParams.categoryId;
    }
    if (queryParams.startDate && queryParams.endDate) {
        whereClause.transactionDate = {
            [Op.between]: [new Date(queryParams.startDate), new Date(queryParams.endDate)]
        };
    } else if (queryParams.startDate) {
        whereClause.transactionDate = { [Op.gte]: new Date(queryParams.startDate) };
    } else if (queryParams.endDate) {
        whereClause.transactionDate = { [Op.lte]: new Date(queryParams.endDate) };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'symbol'] },
        { model: Currency, as: 'originalCurrency', attributes: ['id', 'code', 'symbol'] },
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    });

    return {
      error: false,
      transactions: transactions.map(t => t.toJSON()),
    };
  } catch (error) {
    console.error('Сервісна помилка при отриманні транзакцій подорожі:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося отримати список транзакцій через внутрішню помилку.',
    };
  }
};

exports.updateUserTransaction = async (userId, tripId, transactionId, updateData) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, tripId: tripId },
      include: [{ model: Trip, as: 'trip', where: { userId: userId } }]
    });

    if (!transaction) {
      return {
        error: true,
        statusCode: 404,
        message: 'Транзакцію не знайдено або у вас немає до неї доступу для оновлення.',
      };
    }

    if (updateData.categoryId && updateData.categoryId !== transaction.categoryId) {
      const category = await Category.findByPk(updateData.categoryId);
      if (!category) return { error: true, statusCode: 400, message: `Категорію з ID ${updateData.categoryId} не знайдено.` };
    }
    if (updateData.currencyId && updateData.currencyId !== transaction.currencyId) {
      const currency = await Currency.findByPk(updateData.currencyId);
      if (!currency) return { error: true, statusCode: 400, message: `Валюту з ID ${updateData.currencyId} не знайдено.` };
    }
    if (updateData.hasOwnProperty('originalCurrencyId')) {
        if (updateData.originalCurrencyId !== null && updateData.originalCurrencyId !== transaction.originalCurrencyId) {
            const originalCurrency = await Currency.findByPk(updateData.originalCurrencyId);
            if (!originalCurrency) return { error: true, statusCode: 400, message: `Оригінальну валюту з ID ${updateData.originalCurrencyId} не знайдено.` };
        }
    }

    const updatedTransactionInstance = await transaction.update(updateData);
    const transactionWithDetails = await Transaction.findByPk(updatedTransactionInstance.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'symbol'] },
        { model: Currency, as: 'originalCurrency', attributes: ['id', 'code', 'symbol'] },
      ]
    });

    return {
      error: false,
      transaction: transactionWithDetails.toJSON(),
    };
  } catch (error) {
    console.error('Сервісна помилка при оновленні транзакції:', error);
    if (error.name === 'SequelizeValidationError') {
      return {
        error: true,
        statusCode: 400,
        message: 'Помилка валідації даних при оновленні транзакції.',
        details: error.errors.map(e => ({ field: e.path, message: e.message })),
      };
    }
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося оновити транзакцію через внутрішню помилку.',
    };
  }
};

exports.deleteUserTransaction = async (userId, tripId, transactionId) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, tripId: tripId },
      include: [{ model: Trip, as: 'trip', where: { userId: userId } }]
    });

    if (!transaction) {
      return {
        error: true,
        statusCode: 404,
        message: 'Транзакцію не знайдено або у вас немає до неї доступу для видалення.',
      };
    }

    await transaction.destroy();

    return {
      error: false,
      message: 'Транзакцію успішно видалено.',
    };
  } catch (error) {
    console.error('Сервісна помилка при видаленні транзакції:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося видалити транзакцію через внутрішню помилку.',
    };
  }
};
