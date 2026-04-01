import { Test, TestingModule } from '@nestjs/testing';
import { SwampController } from './swamp.controller';

describe('SwampController', () => {
  let controller: SwampController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwampController],
    }).compile();

    controller = module.get<SwampController>(SwampController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
