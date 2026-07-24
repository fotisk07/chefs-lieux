import type { DepartmentFeature, Player, ScheduledQuestion } from '../types';

export function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildSchedule(
  players: Player[],
  rounds: number,
  turnsPerPlayer: number,
  departments: DepartmentFeature[],
): ScheduledQuestion[] {
  const selected = shuffle(departments).slice(0, players.length * rounds * (turnsPerPlayer + 1));
  let departmentIndex = 0;
  const schedule: ScheduledQuestion[] = [];

  for (let round = 0; round < rounds; round += 1) {
    for (let turn = 0; turn < turnsPerPlayer; turn += 1) {
      for (const player of players) {
        schedule.push({ round, playerId: player.id, departmentCode: selected[departmentIndex++].properties.code, bonus: false });
      }
    }
    for (const player of players) {
      schedule.push({ round, playerId: player.id, departmentCode: selected[departmentIndex++].properties.code, bonus: true });
    }
  }
  return schedule;
}

export function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function streakMessage(streak: number): string | null {
  if (streak >= 5) return `🔥 ${streak} in a row — cartographic genius!`;
  if (streak >= 3) return `🔥 ${streak} in a row!`;
  if (streak === 2) return 'Heating up!';
  return null;
}

export const drinkMessages = [
  'A geographical refreshment is required.',
  'The préfet is disappointed. Take a sip!',
  'Time to hydrate!',
  'That calls for a cartographic sip.',
  'Wrong turn. Take a sip!',
  'France remains mysterious. Santé!',
];

export function randomDrinkMessage(): string {
  return drinkMessages[Math.floor(Math.random() * drinkMessages.length)];
}
