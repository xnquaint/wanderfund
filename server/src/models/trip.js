'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Trip extends Model {
    static associate(models) {
      Trip.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        allowNull: false,
      });

      Trip.belongsTo(models.Currency, {
        foreignKey: 'currencyId',
        as: 'currency',
        allowNull: false,
      });

      Trip.hasMany(models.Transaction, {
        foreignKey: 'tripId',
        as: 'transactions',
        onDelete: 'CASCADE',
      });

      Trip.hasMany(models.Recommendation, {
        foreignKey: 'tripId',
        as: 'recommendations',
        onDelete: 'CASCADE',
      });
    }
  }

  Trip.init(
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
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Назва подорожі не може бути порожньою.',
          },
          len: {
            args: [3, 255],
            msg: 'Назва подорожі повинна містити від 3 до 255 символів.',
          }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date',
        validate: {
          isAfterStartDate(value) {
            if (this.startDate && value && new Date(value) < new Date(this.startDate)) {
              throw new Error('Дата завершення не може бути раніше дати початку.');
            }
          }
        }
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: 'Бюджет повинен бути числом.',
          },
          min: {
            args: [0],
            msg: 'Бюджет не може бути від\'ємним.',
          }
        }
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
      status: {
        type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned',
        validate: {
          isIn: {
            args: [['planned', 'active', 'completed', 'cancelled']],
            msg: 'Невірний статус подорожі.',
          }
        }
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
      modelName: 'Trip',
      tableName: 'trips',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['start_date', 'end_date'],
        },
      ],
    }
  );
  return Trip;
};
