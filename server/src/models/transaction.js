'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Trip, {
        foreignKey: 'tripId',
        as: 'trip',
        allowNull: false,
      });

      Transaction.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
        allowNull: false,
      });

      Transaction.belongsTo(models.Currency, {
        foreignKey: 'currencyId',
        as: 'currency',
        allowNull: false,
      });

      Transaction.belongsTo(models.Currency, {
        foreignKey: 'originalCurrencyId',
        as: 'originalCurrency',
        allowNull: true,
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'trip_id',
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        field: 'category_id',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        }
      },
      originalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'original_amount',
      },
      originalCurrencyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'currencies',
          key: 'id',
        },
        field: 'original_currency_id',
      },
      currencyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'currencies',
          key: 'id',
        },
        field: 'currency_id',
      },
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'transaction_date',
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isImported: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_imported',
      },
      bankTransactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'bank_transaction_id',
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
      modelName: 'Transaction',
      tableName: 'transactions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['trip_id'],
        },
        {
          fields: ['category_id'],
        },
        {
          fields: ['transaction_date'],
        },
      ],
    }
  );
  return Transaction;
};
