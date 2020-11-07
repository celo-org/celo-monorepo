'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.removeIndex(
        'Attestations',
        ['account', 'phoneNumber', 'issuer'],
        { fields: ['account', 'phoneNumber', 'issuer'], unique: true },
        { transaction }
      )

      await queryInterface.removeColumn('Attestations', 'phoneNumber')

      await queryInterface.addColumn('Attestations', 'identifier', {
        type: Sequelize.STRING,
      })

      await queryInterface.addIndex(
        'Attestations',
        ['account', 'identifier', 'issuer'],
        { fields: ['account', 'identifier', 'issuer'], unique: true },
        { transaction }
      )

      await queryInterface.addIndex(
        'Attestations',
        ['createdAt'],
        { fields: ['createdAt'] },
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
        ['account', 'identifier', 'issuer'],
        { fields: ['account', 'identifier', 'issuer'], unique: true },
        { transaction }
      )

      await queryInterface.removeIndex(
        'Attestations',
        ['createdAt'],
        { fields: ['createdAt'] },
        { transaction }
      )

      await queryInterface.removeColumn('Attestations', 'identifier')

      await queryInterface.addColumn('Attestations', 'phoneNumber', {
        type: Sequelize.STRING,
      })

      await queryInterface.addIndex(
        'Attestations',
        ['account', 'phoneNumber', 'issuer'],
        { fields: ['account', 'phoneNumber', 'issuer'], unique: true },
        { transaction }
      )
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
