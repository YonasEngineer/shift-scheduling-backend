import { Test, TestingModule } from '@nestjs/testing';
import { SwampService } from './swamp.service';

describe('SwampService', () => {
  let service: SwampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwampService],
    }).compile();

    service = module.get<SwampService>(SwampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
