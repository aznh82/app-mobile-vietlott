import { GAME_CONFIGS, ALL_GAME_IDS } from './game';
import type { GameId, GameConfig } from './game';

describe('GAME_CONFIGS', () => {
  it('contains exactly 5 games', () => {
    expect(Object.keys(GAME_CONFIGS)).toHaveLength(5);
  });

  it('ALL_GAME_IDS matches GAME_CONFIGS keys', () => {
    expect(ALL_GAME_IDS.sort()).toEqual(Object.keys(GAME_CONFIGS).sort());
  });

  it.each(ALL_GAME_IDS)('%s has all required fields', (gameId) => {
    const config: GameConfig = GAME_CONFIGS[gameId];
    expect(config.id).toBe(gameId);
    expect(config.name).toBeTruthy();
    expect(config.shortName).toBeTruthy();
    expect(config.tableName).toMatch(/^draws_/);
    expect(config.numberCount).toBeGreaterThan(0);
    expect(config.maxNumber).toBeGreaterThan(config.minNumber);
    expect(config.drawDays).toBeTruthy();
    expect(config.pageUrl).toContain('/vi/trung-thuong');
    expect(config.webPartClass).toContain('WebPart');
    expect(config.tabLabel).toBeTruthy();
  });

  it.each(ALL_GAME_IDS)('%s has unique table name', (gameId) => {
    const otherTables = ALL_GAME_IDS
      .filter(id => id !== gameId)
      .map(id => GAME_CONFIGS[id].tableName);
    expect(otherTables).not.toContain(GAME_CONFIGS[gameId].tableName);
  });

  // Lottery games
  describe('lottery games', () => {
    const lotteryIds: GameId[] = ['mega645', 'power655', 'lotto535'];

    it.each(lotteryIds)('%s has minNumber = 1', (gameId) => {
      expect(GAME_CONFIGS[gameId].minNumber).toBe(1);
    });

    it('mega645 has 6 numbers, max 45, has jackpot', () => {
      const c = GAME_CONFIGS.mega645;
      expect(c.numberCount).toBe(6);
      expect(c.maxNumber).toBe(45);
      expect(c.hasJackpot).toBe(true);
    });

    it('power655 has 6 numbers, max 55, has jackpot + special', () => {
      const c = GAME_CONFIGS.power655;
      expect(c.numberCount).toBe(6);
      expect(c.maxNumber).toBe(55);
      expect(c.hasJackpot).toBe(true);
      expect(c.hasSpecialNumber).toBe(true);
    });

    it('lotto535 has 5 numbers, max 35, has special, no jackpot', () => {
      const c = GAME_CONFIGS.lotto535;
      expect(c.numberCount).toBe(5);
      expect(c.maxNumber).toBe(35);
      expect(c.hasSpecialNumber).toBe(true);
      expect(c.hasJackpot).toBe(false);
    });
  });

  // Max 3D games
  describe('Max 3D games', () => {
    const max3dIds: GameId[] = ['max3d', 'max3d_pro'];

    it.each(max3dIds)('%s has minNumber = 0, maxNumber = 999', (gameId) => {
      const c = GAME_CONFIGS[gameId];
      expect(c.minNumber).toBe(0);
      expect(c.maxNumber).toBe(999);
      expect(c.numberCount).toBe(3);
      expect(c.hasJackpot).toBe(false);
      expect(c.hasSpecialNumber).toBe(false);
    });

    it('max3d and max3d_pro have different draw days', () => {
      expect(GAME_CONFIGS.max3d.drawDays).not.toBe(GAME_CONFIGS.max3d_pro.drawDays);
    });

    it('max3d and max3d_pro have different webPartClass', () => {
      expect(GAME_CONFIGS.max3d.webPartClass).not.toBe(GAME_CONFIGS.max3d_pro.webPartClass);
    });
  });
});
