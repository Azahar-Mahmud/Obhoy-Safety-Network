import { requireNativeModule } from 'expo-modules-core';

const LockScreenDisplayModule = requireNativeModule('LockScreenDisplay');

export function showOverLockScreen(): void {
  LockScreenDisplayModule.showOverLockScreen();
}

export function hideOverLockScreen(): void {
  LockScreenDisplayModule.hideOverLockScreen();
}