'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Currency extends Model {
    static associate(models) {
      Currency.hasMany(models.User, {
        foreignKey: 'defaultCurrencyId',
        as: 'usersDefault',
      });

      Currency.hasMany(models.Trip, {
        foreignKey: 'currencyId',
        as: 'tripsBudget',
      });

      Currency.hasMany(models.Transaction, {
        foreignKey: 'originalCurrencyId',
        as: 'originalTransactions',
      });

      Currency.hasMany(models.Transaction, {
        foreignKey: 'currencyId',
        as: 'transactions',
      });
    }
  }

  Currency.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[A-Z]{3}$/,
          notEmpty: true,
        }
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      symbol: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'Currency',
      tableName: 'currencies',
      timestamps: true,
      underscored: true,
    }
  );
  return Currency;
};
