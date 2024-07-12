/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ToolsModule } from './tools/tools.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RateTypeModule } from './rate_type/rate_type.module';
import { FinancialDirectoriesModule } from './financial_directories/financial_directories.module';
import { CountriesModule } from './countries/countries.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './response.interceptor';
import { CurrenciesModule } from './currencies/currencies.module';
import { LanguagesModule } from './languages/languages.module';
import { FreelancesModule } from './freelances/freelances.module';
import { VendorsModule } from './vendors/vendors.module';
import { TemplatesModule } from './templates/templates.module';
import { VariablesModule } from './variables/variables.module';
import { PrismaService } from './prisma.service';
import { MenusModule } from './menus/menus.module';
import { RecordLogModule } from './record_log/record_log.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigModule2 } from './config/config.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // JwtModule.register({
    //   secret: '0Js3dBNX8nMLvFGlP8p0',
    //   signOptions: { expiresIn: '1m'},
    // }),
    ToolsModule,
    ConfigModule.forRoot(),
    RateTypeModule,
    FinancialDirectoriesModule,
    UsersModule,
    CountriesModule,
    CurrenciesModule,
    LanguagesModule,
    FreelancesModule,
    TemplatesModule,
    VendorsModule,
    VariablesModule,
    MenusModule,
    RecordLogModule,
    DashboardModule,
    ConfigModule2
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },    
    PrismaService,
  ],  
})
export class AppModule {}
