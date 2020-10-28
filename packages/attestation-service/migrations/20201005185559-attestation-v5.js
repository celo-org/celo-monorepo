'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.addColumn('Attestations', 'securityCode', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      await queryInterface.addColumn('Attestations', 'attestationCode', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn('Attestations', 'securityCode')
      await queryInterface.removeColumn('Attestations', 'attestationCode')
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
