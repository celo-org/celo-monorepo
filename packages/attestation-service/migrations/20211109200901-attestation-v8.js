'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.removeIndex(
        'Attestations',
        ['ongoingDeliveryId'],
        { fields: ['ongoingDeliveryId'], unique: true },
        { transaction }
      )
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
      await queryInterface.addIndex(
        'Attestations',
        ['ongoingDeliveryId'],
        { fields: ['ongoingDeliveryId'], unique: true },
        { transaction }
      )
    } catch (error) {
      await transaction.rollback()
      if (
        error.errors.length == 1 &&
        error.errors[0].path == 'ongoingDeliveryId' &&
        error.errors[0].type == 'unique violation'
      ) {
        try {
          console.warn('Duplicates in ongoingDeliveryId; nulling out column and retrying.')
          await queryInterface.removeColumn('Attestations', 'ongoingDeliveryId')
          await queryInterface.addColumn('Attestations', 'ongoingDeliveryId', {
            type: Sequelize.STRING,
            allowNull: true,
          })
          await queryInterface.addIndex(
            'Attestations',
            ['ongoingDeliveryId'],
            { fields: ['ongoingDeliveryId'], unique: true },
            { transaction }
          )
        } catch (error) {
          await transaction.rollback()
          throw error
        }
      }
    }
  },
}
