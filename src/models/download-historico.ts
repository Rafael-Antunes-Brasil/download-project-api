import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

// Definindo o modelo Download
export class DownloadHistorico extends Model {
    public id!: number;
    public url!: string;
    public status!: string;  // Ex: 'completed', 'failed'
    public createdAt!: Date;
    public updatedAt!: Date;
}

// Inicializando o modelo com a tabela no banco de dados
DownloadHistorico.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'Download',
        tableName: 'downloads',
    }
);
