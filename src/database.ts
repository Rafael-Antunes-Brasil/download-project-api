import { Sequelize } from 'sequelize';

// Cria uma instância do Sequelize
const sequelize = new Sequelize('irroba-teste', 'postgres', '123456', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

export default sequelize;
