'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const tripRoutes = require('./routes/tripRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const analyticsService = require('./services/analyticsService');

const app = express();

app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/categories', categoryRoutes);

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Не вдалося знайти ${req.originalUrl} на цьому сервері!`,
  });
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  console.error('ПОМИЛКА 💥', err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Щось пішло не так!',
  });
});


const PORT = process.env.PORT || 3001;

db.sequelize.sync()
  .then(async () => {
    console.log('База даних успішно синхронізована.');
    
    try {
      if (analyticsService && typeof analyticsService.trainClassifier === 'function') {
        await analyticsService.trainClassifier();
      } else {
        console.warn('analyticsService.trainClassifier не знайдено або не є функцією. Навчання класифікатора пропущено.');
      }
    } catch (trainError) {
      console.error("Початкове навчання класифікатора не вдалося:", trainError);
    }

    app.listen(PORT, () => {
      console.log(`Сервер запущено на порті ${PORT}...`);
      console.log(`Середовище розробки: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('Помилка синхронізації бази даних або запуску:', err);
    process.exit(1);
  });

module.exports = app;
