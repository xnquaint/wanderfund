'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const tripController = require('../controllers/tripController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', tripController.createTrip);

router.get('/', tripController.getUserTrips);

router.get('/:tripId', tripController.getTripById);

router.put('/:tripId', tripController.updateTrip);

router.delete('/:tripId', tripController.deleteTrip);

const transactionRoutes = require('./transactionRoutes');
router.use('/:tripId/transactions', transactionRoutes);

router.get('/:tripId/forecast', tripController.getTripForecast);

module.exports = router;
