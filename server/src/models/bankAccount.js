'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BankAccount extends Model {
    static associate(models) {
      BankAccount.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        allowNull: false,
      });
    }
  }

  BankAccount.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id',
      },
      bankName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'bank_name',
      },
      accountNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'account_number',
      },
      integrationType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'integration_type',
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'access_token',
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'refresh_token',
      },
      lastSync: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_sync',
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
      modelName: 'BankAccount',
      tableName: 'bank_accounts',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          unique: true,
          fields: ['user_id', 'account_number'],
        },
      ],
    }
  );
  return BankAccount;
};