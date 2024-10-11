import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import bcrypt from 'bcryptjs';

export class Usuario extends Model {
    public id!: number;
    public username!: string;
    public password!: string;

    public static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public async comparePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }
}

// Inicializando o modelo com a tabela no banco de dados
Usuario.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    }
);
