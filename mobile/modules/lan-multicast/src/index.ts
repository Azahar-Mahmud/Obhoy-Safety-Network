import { requireNativeModule } from 'expo-modules-core';

const LanMulticastModule = requireNativeModule('LanMulticast');

export function acquireMulticastLock(): void {
  LanMulticastModule.acquireMulticastLock();
}

export function releaseMulticastLock(): void {
  LanMulticastModule.releaseMulticastLock();
}