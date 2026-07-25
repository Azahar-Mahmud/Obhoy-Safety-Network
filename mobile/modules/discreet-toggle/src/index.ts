import { requireNativeModule } from 'expo-modules-core';

const DiscreetToggleModule = requireNativeModule('DiscreetToggle');

export function enableDisguise(): void {
  DiscreetToggleModule.enableDisguise();
}

export function disableDisguise(): void {
  DiscreetToggleModule.disableDisguise();
}