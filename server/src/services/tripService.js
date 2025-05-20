'use strict';

const { Trip, User, Currency } = require('../models');
const { Op } = require('sequelize');

exports.createTripForUser = async (userId, tripData) => {
  try {
    const currency = await Currency.findByPk(tripData.currencyId);
    if (!currency) {
      return {
        error: true,
        statusCode: 400, // Bad Request
        message: `Валюту з ID ${tripData.currencyId} не знайдено.`,
        details: `Currency with ID ${tripData.currencyId} not found.`,
      };
    }

    const dataToCreate = { ...tripData, userId };

    const newTrip = await Trip.create(dataToCreate);

    const tripWithDetails = await Trip.findByPk(newTrip.id, {
      include: [
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'name', 'symbol'] },
      ]
    });


    return {
      error: false,
      trip: tripWithDetails.toJSON(),
    };
  } catch (error) {
    console.error('Сервісна помилка при створенні подорожі:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return {
        error: true,
        statusCode: 400,
        message: 'Помилка валідації даних для подорожі.',
        details: error.errors.map(e => ({ field: e.path, message: e.message })),
      };
    }
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося створити подорож через внутрішню помилку.',
    };
  }
};

exports.getTripsByUserId = async (userId, queryParams = {}) => {
  try {
    const trips = await Trip.findAll({
      where: { userId: userId },
      include: [
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'name', 'symbol'] }
      ],
      order: [['startDate', 'DESC']],
    });

    return {
      error: false,
      trips: trips.map(trip => trip.toJSON()),
    };
  } catch (error) {
    console.error('Сервісна помилка при отриманні подорожей користувача:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося отримати список подорожей через внутрішню помилку.',
    };
  }
};

exports.getTripDetails = async (userId, tripId) => {
  try {
    const trip = await Trip.findOne({
      where: { id: tripId, userId: userId },
      include: [
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'name', 'symbol'] },
      ],
    });

    if (!trip) {
      return {
        error: true,
        statusCode: 404,
        message: 'Подорож не знайдено або у вас немає до неї доступу.',
      };
    }

    return {
      error: false,
      trip: trip.toJSON(),
    };
  } catch (error) {
    console.error('Сервісна помилка при отриманні деталей подорожі:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося отримати деталі подорожі через внутрішню помилку.',
    };
  }
};

exports.updateUserTrip = async (userId, tripId, updateData) => {
  try {
    const trip = await Trip.findOne({
      where: { id: tripId, userId: userId },
    });

    if (!trip) {
      return {
        error: true,
        statusCode: 404,
        message: 'Подорож не знайдено або у вас немає до неї доступу для оновлення.',
      };
    }

    if (updateData.currencyId && updateData.currencyId !== trip.currencyId) {
      const currency = await Currency.findByPk(updateData.currencyId);
      if (!currency) {
        return {
          error: true,
          statusCode: 400,
          message: `Валюту з ID ${updateData.currencyId} не знайдено.`,
          details: `Currency with ID ${updateData.currencyId} not found.`,
        };
      }
    }

    const updatedTripInstance = await trip.update(updateData);

     const tripWithDetails = await Trip.findByPk(updatedTripInstance.id, {
      include: [
        { model: Currency, as: 'currency', attributes: ['id', 'code', 'name', 'symbol'] },
      ]
    });


    return {
      error: false,
      trip: tripWithDetails.toJSON(),
    };
  } catch (error) {
    console.error('Сервісна помилка при оновленні подорожі:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return {
        error: true,
        statusCode: 400,
        message: 'Помилка валідації даних при оновленні подорожі.',
        details: error.errors.map(e => ({ field: e.path, message: e.message })),
      };
    }
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося оновити подорож через внутрішню помилку.',
    };
  }
};

exports.deleteUserTrip = async (userId, tripId) => {
  try {
    const trip = await Trip.findOne({
      where: { id: tripId, userId: userId },
    });

    if (!trip) {
      return {
        error: true,
        statusCode: 404,
        message: 'Подорож не знайдено або у вас немає до неї доступу для видалення.',
      };
    }

    await trip.destroy();

    return {
      error: false,
      message: 'Подорож успішно видалено.',
    };
  } catch (error) {
    console.error('Сервісна помилка при видаленні подорожі:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося видалити подорож через внутрішню помилку.',
    };
  }
};
