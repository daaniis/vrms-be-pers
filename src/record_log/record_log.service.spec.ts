import { Test, TestingModule } from '@nestjs/testing';
import { RecordLogService } from './record_log.service';

describe('RecordLogService', () => {
  let service: RecordLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordLogService],
    }).compile();

    service = module.get<RecordLogService>(RecordLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
