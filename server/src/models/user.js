'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Trip, {
        foreignKey: 'userId',
        as: 'trips',
      });
      User.hasMany(models.BankAccount, {
        foreignKey: 'userId',
        as: 'bankAccounts',
      });
      User.belongsTo(models.Currency, {
        foreignKey: 'defaultCurrencyId',
        as: 'defaultCurrency',
      });
    }

    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'last_name',
      },
      defaultCurrencyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'currencies',
          key: 'id',
        },
        field: 'default_currency_id',
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
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password') && user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );
  return User;
};