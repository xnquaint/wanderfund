'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Recommendation extends Model {
    static associate(models) {
      Recommendation.belongsTo(models.Trip, {
        foreignKey: 'tripId',
        as: 'trip',
        allowNull: false,
      });
      Recommendation.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
        allowNull: true,
      });
    }
  }
  Recommendation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'trips', key: 'id' },
      field: 'trip_id',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      field: 'category_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    impact: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'viewed', 'applied', 'dismissed'),
      allowNull: false,
      defaultValue: 'new',
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
  }, {
    sequelize,
    modelName: 'Recommendation',
    tableName: 'recommendations',
    timestamps: true,
    underscored: true,
  });
  return Recommendation;
};