import type { GameId } from './game';

export type RootTabParamList = {
  Home: undefined;
  Game645: undefined;
  Game655: undefined;
  Game535: undefined;
  GameMax3D: undefined;
};

export type GameStackParamList = {
  GameDetail: { gameId: GameId };
  GameStats: { gameId: GameId };
};
