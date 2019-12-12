'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.createTable('Attestations', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        account: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        phoneNumber: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        issuer: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        status: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        smsProvider: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })

      await queryInterface.addIndex(
        'Attestations',
        ['account', 'phoneNumber', 'issuer'],
        { fields: ['account', 'phoneNumber', 'issuer'], unique: true },
        { transaction }
      )

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Attestations')
  },
}
