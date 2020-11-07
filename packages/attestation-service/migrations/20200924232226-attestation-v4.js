'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.addColumn('Attestations', 'completedAt', {
        type: Sequelize.DATE,
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
      await queryInterface.removeColumn('Attestations', 'completedAt')
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
