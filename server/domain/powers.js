import { POWER_IDS, POWERS_PER_PLAYER } from './constants.js';

export function validatePowerChoice(powers) {
  if (!Array.isArray(powers)) return false;
  if (powers.length !== POWERS_PER_PLAYER) return false;
  if (new Set(powers).size !== POWERS_PER_PLAYER) return false;
  return powers.every(p => Object.values(POWER_IDS).includes(p));
}

export function initPowerState(player) {
  player.powerState = {};
  player.powers.forEach(id => {
    player.powerState[id] = {
      available: true,
      active: false,
      data: null,
    };
  });
}

export function hasPower(player, powerId) {
  return player.powers.includes(powerId);
}

export function isPowerAvailable(player, powerId) {
  return hasPower(player, powerId) && player.powerState[powerId]?.available;
}

export function consumePower(player, powerId) {
  if (player.powerState[powerId]) {
    player.powerState[powerId].available = false;
  }
}