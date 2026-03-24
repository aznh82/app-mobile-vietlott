export type GameId =
  | 'mega645'
  | 'power655'
  | 'lotto535'
  | 'max3d'
  | 'max3d_pro';

export interface GameConfig {
  id: GameId;
  name: string;
  shortName: string;
  tableName: string;
  numberCount: number;
  maxNumber: number;
  minNumber: number;
  hasSpecialNumber: boolean;
  hasJackpot: boolean;
  drawDays: string;
  pageUrl: string;
  webPartClass: string;
  tabLabel: string;
  tabIcon: string;
}

const BASE = '/vi/trung-thuong/ket-qua-trung-thuong';

export const GAME_CONFIGS: Record<GameId, GameConfig> = {
  mega645: {
    id: 'mega645',
    name: 'Mega 6/45',
    shortName: '6/45',
    tableName: 'draws_645',
    numberCount: 6,
    maxNumber: 45,
    minNumber: 1,
    hasSpecialNumber: false,
    hasJackpot: true,
    drawDays: 'T4, T6, CN',
    pageUrl: `${BASE}/winning-number-645`,
    webPartClass: 'Game645CompareWebPart',
    tabLabel: '6/45',
    tabIcon: '🎯',
  },
  power655: {
    id: 'power655',
    name: 'Power 6/55',
    shortName: '6/55',
    tableName: 'draws_655',
    numberCount: 6,
    maxNumber: 55,
    minNumber: 1,
    hasSpecialNumber: true,
    hasJackpot: true,
    drawDays: 'T3, T5, T7',
    pageUrl: `${BASE}/winning-number-655`,
    webPartClass: 'Game655CompareWebPart',
    tabLabel: '6/55',
    tabIcon: '⚡',
  },
  lotto535: {
    id: 'lotto535',
    name: 'Lotto 5/35',
    shortName: '5/35',
    tableName: 'draws_535',
    numberCount: 5,
    maxNumber: 35,
    minNumber: 1,
    hasSpecialNumber: true,
    hasJackpot: false,
    drawDays: 'T3, T5, T7',
    pageUrl: `${BASE}/winning-number-535`,
    webPartClass: 'Game535CompareWebPart',
    tabLabel: '5/35',
    tabIcon: '🍀',
  },
  max3d: {
    id: 'max3d',
    name: 'Max 3D',
    shortName: '3D',
    tableName: 'draws_max3d',
    numberCount: 3,
    maxNumber: 999,
    minNumber: 0,
    hasSpecialNumber: false,
    hasJackpot: false,
    drawDays: 'T2, T4, T6',
    pageUrl: `${BASE}/ket-qua-max-3d`,
    webPartClass: 'GameMax3DResultDetailWebPart',
    tabLabel: '3D',
    tabIcon: '🎲',
  },
  max3d_pro: {
    id: 'max3d_pro',
    name: 'Max 3D Pro',
    shortName: '3D+',
    tableName: 'draws_max3d_pro',
    numberCount: 3,
    maxNumber: 999,
    minNumber: 0,
    hasSpecialNumber: false,
    hasJackpot: false,
    drawDays: 'T3, T5, T7',
    pageUrl: `${BASE}/ket-qua-max-3d-pro`,
    webPartClass: 'GameMax3DProResultDetailWebPart',
    tabLabel: '3D+',
    tabIcon: '🎰',
  },
};

export const ALL_GAME_IDS: GameId[] = Object.keys(GAME_CONFIGS) as GameId[];
