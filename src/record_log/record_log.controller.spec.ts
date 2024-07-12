import { Test, TestingModule } from '@nestjs/testing';
import { RecordLogController } from './record_log.controller';
import { RecordLogService } from './record_log.service';

describe('RecordLogController', () => {
  let controller: RecordLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordLogController],
      providers: [RecordLogService],
    }).compile();

    controller = module.get<RecordLogController>(RecordLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
