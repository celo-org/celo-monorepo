'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.removeColumn('Attestations', 'smsProvider')

      await queryInterface.addColumn('Attestations', 'countryCode', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'phoneNumber', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'message', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'ongoingDeliveryId', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'providers', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'attempt', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'errorCode', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addIndex(
        'Attestations',
        ['ongoingDeliveryId'],
        { fields: ['ongoingDeliveryId'], unique: false },
        { transaction }
      )

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeIndex(
        'Attestations',
        ['ongoingDeliveryId'],
        { fields: ['ongoingDeliveryId'], unique: false },
        { transaction }
      )

      await queryInterface.removeColumn('Attestations', 'countryCode')

      await queryInterface.removeColumn('Attestations', 'phoneNumber')

      await queryInterface.removeColumn('Attestations', 'message')

      await queryInterface.removeColumn('Attestations', 'ongoingDeliveryId')

      await queryInterface.removeColumn('Attestations', 'providers')

      await queryInterface.removeColumn('Attestations', 'attempt')

      await queryInterface.removeColumn('Attestations', 'errorCode')

      await queryInterface.addColumn('Attestations', 'smsProvider', {
        type: Sequelize.STRING,
        allowNull: false,
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
