'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });

const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', transactionController.addTransactionToTrip);

router.get('/', transactionController.getTransactionsForTrip);

router.put('/:transactionId', transactionController.updateTransaction);

router.put('/:transactionId', transactionController.updateTransaction);

router.delete('/:transactionId', transactionController.deleteTransaction);

module.exports = router;
