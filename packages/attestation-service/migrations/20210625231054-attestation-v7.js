'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.addColumn('Attestations', 'appSignature', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      await queryInterface.addColumn('Attestations', 'language', {
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
      await queryInterface.removeColumn('Attestations', 'appSignature')
      await queryInterface.removeColumn('Attestations', 'language')
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
