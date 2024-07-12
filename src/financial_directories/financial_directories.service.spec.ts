import { Test, TestingModule } from '@nestjs/testing';
import { FinancialDirectoriesService } from './financial_directories.service';

describe('FinancialDirectoriesService', () => {
  let service: FinancialDirectoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialDirectoriesService],
    }).compile();

    service = module.get<FinancialDirectoriesService>(
      FinancialDirectoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
