import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type GameMode = 'capital' | 'map';

export type DepartmentProperties = {
  code: string;
  name: string;
  capital: string;
};

export type DepartmentFeature = Feature<Geometry, DepartmentProperties>;
export type DepartmentCollection = FeatureCollection<Geometry, DepartmentProperties>;

export type Player = {
  id: string;
  name: string;
  totalScore: number;
  roundScore: number;
  drinks: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
};

export type GameSettings = {
  rounds: number;
  turnsPerPlayer: number;
  mode: GameMode;
};

export type ScheduledQuestion = {
  round: number;
  playerId: string;
  departmentCode: string;
  bonus: boolean;
};

export type AnswerResult = {
  correct: boolean;
  chosenCode?: string;
  chosenCapital?: string;
  distanceKm?: number;
  points: number;
};
