import { Test, TestingModule } from '@nestjs/testing';
import { RateTypeService } from './rate_type.service';

describe('RateTypeService', () => {
  let service: RateTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateTypeService],
    }).compile();

    service = module.get<RateTypeService>(RateTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
