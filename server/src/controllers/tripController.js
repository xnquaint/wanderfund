'use strict';

const tripService = require('../services/tripService');
const analyticsService = require('../services/analyticsService');

exports.createTrip = async (req, res) => {
  try {
    const tripData = {
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      budget: req.body.budget,
      currencyId: req.body.currencyId,
      status: req.body.status || 'planned',
    };
    const userId = req.user.id;
    const result = await tripService.createTripForUser(userId, tripData);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ message: result.message, details: result.details });
    }
    res.status(201).json({
      message: 'Подорож успішно створено.',
      trip: result.trip,
    });
  } catch (error) {
    console.error('Помилка в контролері createTrip:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при створенні подорожі.' });
  }
};

exports.getUserTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tripService.getTripsByUserId(userId, req.query);

    if (result.error) {
      return res.status(result.statusCode || 404).json({ message: result.message });
    }
    res.status(200).json({
      message: 'Список подорожей успішно отримано.',
      count: result.trips.length,
      trips: result.trips,
    });
  } catch (error) {
    console.error('Помилка в контролері getUserTrips:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні подорожей.' });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const result = await tripService.getTripDetails(userId, tripId);

    if (result.error) {
      return res.status(result.statusCode || 404).json({ message: result.message });
    }
    res.status(200).json({
      message: 'Деталі подорожі успішно отримано.',
      trip: result.trip,
    });
  } catch (error) {
    console.error('Помилка в контролері getTripById:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні деталей подорожі.' });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const updateData = req.body;
    if (updateData.userId) {
      delete updateData.userId;
    }
    const result = await tripService.updateUserTrip(userId, tripId, updateData);

    if (result.error) {
      return res.status(result.statusCode || 400).json({ message: result.message, details: result.details });
    }
    res.status(200).json({
      message: 'Подорож успішно оновлено.',
      trip: result.trip,
    });
  } catch (error) {
    console.error('Помилка в контролері updateTrip:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при оновленні подорожі.' });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const result = await tripService.deleteUserTrip(userId, tripId);

    if (result.error) {
      return res.status(result.statusCode || 404).json({ message: result.message });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Помилка в контролері deleteTrip:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при видаленні подорожі.' });
  }
};

exports.getTripForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const result = await analyticsService.getSpendingForecast(userId, tripId);

    if (result.error) {
      return res.status(result.statusCode || 500).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Прогноз витрат успішно отримано.',
      forecast: result.forecast,
    });
  } catch (error) {
    console.error('Помилка в контролері getTripForecast:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при отриманні прогнозу витрат.' });
  }
};
