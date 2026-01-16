import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// load environment variables
config();

// database configuration for migrations
// this file is used by TypeORM CLI for running migrations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'nestjs_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, // always false - use migrations instead
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
