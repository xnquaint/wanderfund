'use strict';

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get(
  '/',
  categoryController.fetchAllCategories
);


module.exports = router;
