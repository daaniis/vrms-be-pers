/* eslint-disable prettier/prettier */
import { config } from 'dotenv';
import { from } from 'env-var';

config({ path: '.env' });

export class ConfigService {
  private env = from(process.env);
  public readonly DATABASE_URL = this.env
    .get('DATABASE_URL')
    .required()
    .asUrlString();
  public readonly JWT_SECRET = this.env.get('JWT_SECRET').required().asString();
  public readonly JWT_EXPIRES_IN = this.env
    .get('JWT_EXPIRES_IN')
    .required()
    .asString();
}
