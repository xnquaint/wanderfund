'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models'); 
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-for-jwt';

exports.verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Витягуємо сам токен

      const decoded = jwt.verify(token, JWT_SECRET);
      const currentUser = await User.findByPk(decoded.id);

      if (!currentUser) {
        return res.status(401).json({
          message: 'Користувача, пов\'язаного з цим токеном, більше не існує.',
        });
      }

      req.user = currentUser;
      req.token = token;

      next();
    } catch (error) {
      console.error('Помилка верифікації токена:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Термін дії токена закінчився. Будь ласка, увійдіть знову.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Невалідний токен. Помилка автентифікації.' });
      }
      return res.status(401).json({ message: 'Помилка автентифікації. Не вдалося перевірити токен.' });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Доступ заборонено. Токен автентифікації не надано.',
    });
  }
};
