'use strict';

const authService = require('../services/authService');
const { User } = require('../models');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, defaultCurrencyId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Будь ласка, надайте електронну пошту та пароль.' });
    }


    const result = await authService.registerNewUser({
      email,
      password,
      firstName,
      lastName,
      defaultCurrencyId,
    });

    if (result.error) {
      return res.status(result.statusCode || 400).json({ message: result.message });
    }

  
    res.status(201).json({
      message: 'Користувача успішно зареєстровано. Будь ласка, увійдіть.',
      user: result.user,
    });

  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера під час реєстрації.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Будь ласка, надайте електронну пошту та пароль.' });
    }

    const result = await authService.loginExistingUser({ email, password });

    if (result.error) {
      return res.status(result.statusCode || 401).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Вхід успішний.',
      token: result.token,
      user: result.user,
    });

  } catch (error) {
    console.error('Помилка входу:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера під час входу.' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findByPk(userId);

    if (!currentUser) {
      return res.status(404).json({ message: 'Користувача не знайдено.' });
    }

    res.status(200).json({ user: currentUser });
  } catch (error) {
    console.error('Помилка отримання поточного користувача:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера.' });
  }
};
