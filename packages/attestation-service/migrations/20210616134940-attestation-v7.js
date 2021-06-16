'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.addColumn('Attestations', 'phoneNumberType', {
        type: Sequelize.STRING,
        allowNull: true,
      })

      await queryInterface.addColumn('Attestations', 'credentials', {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  down: (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn('Attestations', 'phoneNumberType')
      await queryInterface.removeColumn('Attestations', 'credentials')
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
};
