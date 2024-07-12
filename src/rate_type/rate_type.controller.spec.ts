import { Test, TestingModule } from '@nestjs/testing';
import { RateTypeController } from './rate_type.controller';
import { RateTypeService } from './rate_type.service';

describe('RateTypeController', () => {
  let controller: RateTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateTypeController],
      providers: [RateTypeService],
    }).compile();

    controller = module.get<RateTypeController>(RateTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
