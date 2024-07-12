import { Test, TestingModule } from '@nestjs/testing';
import { FinancialDirectoriesController } from './financial_directories.controller';
import { FinancialDirectoriesService } from './financial_directories.service';

describe('FinancialDirectoriesController', () => {
  let controller: FinancialDirectoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialDirectoriesController],
      providers: [FinancialDirectoriesService],
    }).compile();

    controller = module.get<FinancialDirectoriesController>(
      FinancialDirectoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
