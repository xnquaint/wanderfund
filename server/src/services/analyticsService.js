'use strict';

const natural = require('natural');
const NaiveBayesClassifier = natural.BayesClassifier;
const { Category, Trip, Transaction, Currency } = require('../models');
const { Op } = require('sequelize');

let classifier;
if (typeof NaiveBayesClassifier === 'function') {
  classifier = new NaiveBayesClassifier();
} else {
  console.error('GLOBAL: NaiveBayesClassifier is not a function/constructor. Classifier not initialized.');
  classifier = { addDocument: () => {}, train: () => {}, classify: () => null, getClassifications: () => [], docs: [], features: {} };
}
let isClassifierTrained = false;

exports.trainClassifier = async function() {
  console.log('Attempting to train classifier...');
  if (typeof NaiveBayesClassifier !== 'function') {
    console.error('trainClassifier: NaiveBayesClassifier is not a constructor. Training aborted.');
    isClassifierTrained = false;
    return;
  }
  const localClassifier = new NaiveBayesClassifier();
  let documentsAdded = 0;
  const categoriesData = [
    { name: 'Харчування', keywords: ['їжа', 'ресторан', 'кафе', 'обід', 'вечеря', 'сніданок', 'продукти', 'супермаркет', 'кава', 'вода', 'напої', 'бакалія', 'гастроном', 'їдальня', 'фастфуд', 'піца', 'суші', 'чек з кафе', 'продуктовий магазин', 'ринок', 'фрукти', 'овочі', 'десерт', 'перекус', 'замовив їжу', 'рахунок за обід', 'кав\'ярня', 'бістро', 'їсти', 'поїсти', 'харчі', 'обід в ресторані', 'вечеря в ресторані', 'сніданок в кафе', 'кава в кав\'ярні', 'рахунок з ресторану', 'заплатив за їжу', 'купив продукти', 'їжа на винос', 'доставка їжі', 'їжа в місцевому ресторані', 'місцевий ресторан', 'ресторані' ]},
    { name: 'Проживання', keywords: [ 'готель', 'хостел', 'апартаменти', 'оренда житла', 'нічліг', 'booking com', 'airbnb', 'мотель', 'гостьовий дім', 'оплата номера', 'бронювання готелю', 'кімната', 'ніч в готелі', 'проживати', 'заселення', 'номер в готелі' ]},
    { name: 'Транспорт', keywords: [ 'квиток на поїзд', 'авіаквиток', 'квиток на автобус', 'таксі до вокзалу', 'метрополітен', 'бензин азс', 'паливо для авто', 'проїздний квиток', 'дорожні витрати', 'переліт', 'паркування авто', 'оренда авто', 'блаблакар', 'заправка', 'автобусний квиток', 'залізничний квиток', 'літак', 'пором', 'трансфер', 'громадський транспорт', 'поїздка', 'дорога' ]},
    { name: 'Розваги', keywords: [ 'квитки в кіно', 'театральний квиток', 'вхід до музею', 'концертний білет', 'екскурсійний тур', 'парк атракціонів', 'відвідування парку', 'нічний клуб', 'боулінг-клуб', 'абонемент в спортзал', 'виставка', 'фестиваль', 'зоопарк', 'аквапарк', 'атракціони', 'дозвілля', 'відпочинок активний', 'культурний захід', 'білети на шоу' ]},
    { name: 'Покупки', keywords: [ 'одяг з магазину', 'сувенірна продукція', 'подарунковий сертифікат', 'побутова техніка', 'косметичні засоби', 'книгарня', 'дитячі іграшки', 'покупка електроніки', 'дьюті фрі', 'місцеві товари', 'арт-об\'єкти', 'ювелірні вироби', 'шопінг', 'покупка', 'купити', 'магазин одягу' ]},
    { name: 'Зв\'язок', keywords: [ 'поповнення мобільного', 'оплата інтернету', 'телефонні розмови', 'роумінг послуги', 'стартовий пакет', 'мобільний зв\'язок', 'сім-карта', 'wifi доступ', 'інтернет кафе' ]},
    { name: 'Медицина', keywords: [ 'ліки з аптеки', 'візит до лікаря', 'медична страховка', 'стоматологічні послуги', 'медичні аналізи', 'аптечка', 'термінова допомога', 'лікування' ]},
    { name: 'Інше', keywords: [ 'банківська комісія', 'ремонтні послуги', 'туристичний збір', 'оформлення візи', 'страхування подорожі', 'послуги гіда', 'чайові', 'камера схову', 'пральня', 'непередбачені витрати', 'інші збори', 'пожертва', 'мито', 'дрібні витрати' ]},
  ];
  for (const catData of categoriesData) {
    const category = await Category.findOne({ where: { name: catData.name } });
    if (category) {
      catData.keywords.forEach(keyword => { localClassifier.addDocument(keyword.toLowerCase().split(' '), category.name); documentsAdded++; });
    } else { console.warn(`Category "${catData.name}" not found in DB for training classifier.`); }
  }
  if (documentsAdded > 0) {
    try { localClassifier.train(); classifier = localClassifier; isClassifierTrained = true; console.log(`Classifier training complete. ${documentsAdded} documents processed.`); }
    catch (trainError) { console.error('Error training classifier:', trainError); isClassifierTrained = false; }
  } else { console.warn('No documents were added to the classifier. Training skipped.'); isClassifierTrained = false; }
};
exports.autoCategorizeTransactionByDescription = async function(description) {
  if (!classifier || typeof NaiveBayesClassifier !== 'function') { return null; }
  if (!isClassifierTrained) {
    await exports.trainClassifier();
    if (!isClassifierTrained) { return null; }
  }
  if (!description || typeof description !== 'string' || description.trim() === '') { return null; }
  const tokens = description.toLowerCase().split(' ');
  const classifications = classifier.getClassifications(tokens);
  if (classifications && classifications.length > 0) {
    const predictedCategoryName = classifications[0].label;
    const category = await Category.findOne({ where: { name: predictedCategoryName } });
    if (category) return { id: category.id, name: category.name };
  }
  return null;
};


exports.getSpendingForecast = async (userId, tripId) => {
  try {
    const trip = await Trip.findOne({
      where: { id: tripId, userId: userId },
      include: [{ model: Currency, as: 'currency' }]
    });

    if (!trip) {
      return { error: true, statusCode: 404, message: 'Подорож не знайдено або у вас немає до неї доступу.' };
    }

    if (trip.status === 'completed' || trip.status === 'cancelled') {
        return { error: false, forecast: { message: 'Прогнозування не доступне для завершених або скасованих подорожей.', tripStatus: trip.status, budget: parseFloat(trip.budget), currency: trip.currency.toJSON() } };
    }

    const transactions = await Transaction.findAll({
      where: { tripId: tripId },
      order: [['transactionDate', 'ASC']],
    });

    const today = new Date();
    const tripStartDate = new Date(trip.startDate);
    const tripEndDate = new Date(trip.endDate);
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const totalTripDays = Math.floor((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (totalTripDays <= 0) {
        return { error: true, statusCode: 400, message: 'Некоректні дати подорожі.' };
    }

    let daysPassed = 0;
    if (todayDateOnly >= tripStartDate) {
      daysPassed = Math.floor((todayDateOnly.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (daysPassed > totalTripDays) {
        daysPassed = totalTripDays;
      }
    }

    let daysRemaining = totalTripDays - daysPassed;
    if (daysRemaining < 0) daysRemaining = 0;

    if (todayDateOnly > tripEndDate && trip.status !== 'completed') {
         return { error: false, forecast: { message: 'Подорож вже завершилася (згідно з датами).', tripStatus: 'ended_by_date', budget: parseFloat(trip.budget), currency: trip.currency.toJSON() } };
    }

    let totalSpent = 0;
    transactions.forEach(t => {
      totalSpent += parseFloat(t.amount);
    });

    const budget = parseFloat(trip.budget);
    const remainingBudget = budget - totalSpent;
    
    let averageDailySpending = 0;
    let projectedRemainingSpending = 0;

    if (daysPassed > 0) {
      averageDailySpending = totalSpent > 0 ? totalSpent / daysPassed : 0;
      projectedRemainingSpending = averageDailySpending * daysRemaining;
    } else {
      if (totalTripDays > 0) {
          averageDailySpending = budget / totalTripDays;
      }
      projectedRemainingSpending = averageDailySpending * daysRemaining; 
    }

    const projectedEndOfTripBalance = remainingBudget - projectedRemainingSpending;

    let advice = 'Проаналізуйте ваші витрати та бюджет.';
    if (trip.status === 'planned' && todayDateOnly < tripStartDate) {
        advice = `Подорож запланована. Ваш загальний бюджет: ${budget.toFixed(2)} ${trip.currency.code}. `;
        advice += `Планові середньоденні витрати (розраховані на весь бюджет): ${averageDailySpending.toFixed(2)} ${trip.currency.code}. `;
        if (totalSpent > 0) {
            advice += `Вже витрачено (до початку подорожі): ${totalSpent.toFixed(2)} ${trip.currency.code}. `;
            advice += `Фактичний залишок бюджету: ${remainingBudget.toFixed(2)} ${trip.currency.code}. `;
            if (projectedEndOfTripBalance < 0) {
                 advice += `Якщо протягом ${daysRemaining} днів подорожі ви будете витрачати за початковим планом (${averageDailySpending.toFixed(2)} ${trip.currency.code}/день), прогнозується дефіцит ${Math.abs(projectedEndOfTripBalance).toFixed(2)} ${trip.currency.code}.`;
            } else {
                 advice += `Якщо протягом ${daysRemaining} днів подорожі ви будете витрачати за початковим планом, прогнозований залишок на кінець: ${projectedEndOfTripBalance.toFixed(2)} ${trip.currency.code}.`;
            }
            if (daysRemaining > 0 && remainingBudget > 0) {
                advice += ` Щоб вкластися в залишок (${remainingBudget.toFixed(2)} ${trip.currency.code}), вам потрібно витрачати не більше ${(remainingBudget / daysRemaining).toFixed(2)} ${trip.currency.code} на день.`;
            } else if (daysRemaining > 0 && remainingBudget <= 0) {
                advice += ` Бюджет вже вичерпано або є дефіцит.`;
            }
        } else {
            advice += `Прогнозований залишок на кінець: ${projectedEndOfTripBalance.toFixed(2)} ${trip.currency.code} (якщо витрачатимете планово).`;
        }
    } else if (daysRemaining > 0) {
        advice = `Поточні середньоденні витрати: ${averageDailySpending.toFixed(2)} ${trip.currency.code}. `;
        advice += `Залишок бюджету: ${remainingBudget.toFixed(2)} ${trip.currency.code}. Днів залишилося: ${daysRemaining}. `;
        if (projectedEndOfTripBalance < 0) {
            advice += `Увага! При такому темпі вам може не вистачити бюджету. Прогнозований дефіцит: ${Math.abs(projectedEndOfTripBalance).toFixed(2)} ${trip.currency.code}.`;
        } else {
            advice += `Ви вписуєтесь в бюджет. Прогнозований залишок на кінець: ${projectedEndOfTripBalance.toFixed(2)} ${trip.currency.code}.`;
        }
    } else {
        if (remainingBudget < 0) {
            advice = `Подорож завершується (або завершилася). Ви перевищили бюджет на ${Math.abs(remainingBudget).toFixed(2)} ${trip.currency.code}.`;
        } else {
            advice = `Подорож завершується (або завершилася). Залишок бюджету: ${remainingBudget.toFixed(2)} ${trip.currency.code}.`;
        }
    }

    const forecast = {
      tripTitle: trip.title,
      tripStatus: trip.status,
      budget: budget,
      currency: trip.currency.toJSON(),
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalTripDays: totalTripDays,
      daysPassed: daysPassed,
      daysRemaining: daysRemaining,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      remainingBudget: parseFloat(remainingBudget.toFixed(2)),
      averageDailySpending: parseFloat(averageDailySpending.toFixed(2)),
      projectedRemainingSpending: parseFloat(projectedRemainingSpending.toFixed(2)),
      projectedEndOfTripBalance: parseFloat(projectedEndOfTripBalance.toFixed(2)),
      advice: advice,
    };
    return { error: false, forecast };
  } catch (error) {
    console.error('Сервісна помилка при прогнозуванні витрат:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Не вдалося розрахувати прогноз витрат через внутрішню помилку.',
    };
  }
};
