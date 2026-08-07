import { requireNativeModule } from 'expo-modules-core';

const HardwareTriggerModule = requireNativeModule('HardwareTrigger');

export function simulateTrigger(): void {
  HardwareTriggerModule.simulateTrigger();
}