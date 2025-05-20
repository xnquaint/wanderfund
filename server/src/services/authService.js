'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-for-jwt';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

exports.registerNewUser = async (userData) => {
  const { email, password, firstName, lastName, defaultCurrencyId } = userData;

  try {
    const existingUser = await User.scope('withPassword').findOne({ where: { email: email } });
    if (existingUser) {
      return {
        error: true,
        statusCode: 409,
        message: 'Користувач з такою електронною поштою вже існує.',
      };
    }

    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      defaultCurrencyId,
    });

    const plainUser = newUser.get({ plain: true });
    delete plainUser.password;

    return {
      error: false,
      user: plainUser,
    };

  } catch (error) {
    console.error('Сервісна помилка при реєстрації:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося зареєструвати користувача через внутрішню помилку.',
    };
  }
};


exports.loginExistingUser = async (credentials) => {
  const { email, password } = credentials;

  try {
    const user = await User.scope('withPassword').findOne({ where: { email: email } });

    if (!user) {
      return { error: true, statusCode: 401, message: 'Невірний email або пароль.' };
    }

    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      return { error: true, statusCode: 401, message: 'Невірний email або пароль.' };
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const userToReturn = user.get({ plain: true });
    delete userToReturn.password;

    return {
      error: false,
      token,
      user: userToReturn,
    };

  } catch (error) {
    console.error('Сервісна помилка при вході:', error);
    return { error: true, statusCode: 500, message: 'Не вдалося увійти через внутрішню помилку.' };
  }
};