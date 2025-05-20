'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.belongsTo(models.Category, {
        as: 'parent',
        foreignKey: 'parentId',
        allowNull: true,
      });
      Category.hasMany(models.Category, {
        as: 'subcategories',
        foreignKey: 'parentId',
        onDelete: 'CASCADE',
      });

      Category.hasMany(models.Transaction, {
        foreignKey: 'categoryId',
        as: 'transactions',
      });

      Category.hasMany(models.Recommendation, {
        foreignKey: 'categoryId',
        as: 'recommendations',
      });
    }
  }

  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Назва категорії не може бути порожньою.',
          },
        }
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        field: 'parent_id',
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
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['name']
        },
        {
          fields: ['parent_id']
        }
      ]
    }
  );
  return Category;
};
