'use strict';

const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

router.get(
  '/',
  currencyController.fetchAllCurrencies
);

module.exports = router;