import { Accelerometer } from 'expo-sensors';

const FREEFALL_THRESHOLD = 0.4;
const FREEFALL_MIN_MS = 100;
const IMPACT_WINDOW_MS = 1500;
const SENSITIVITY_THRESHOLDS = { low: 3.5, medium: 2.5, high: 1.8 };

export type Sensitivity = 'low' | 'medium' | 'high';

let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let freefallStartedAt: number | null = null;

export function startFallDetection(sensitivity: Sensitivity, onFallDetected: () => void): void {
  if (subscription) return;
  const impactThreshold = SENSITIVITY_THRESHOLDS[sensitivity];

  Accelerometer.setUpdateInterval(100);
  subscription = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    // 1. Detect Free-fall
    if (magnitude < FREEFALL_THRESHOLD) {
      if (freefallStartedAt === null) freefallStartedAt = now;
      return;
    }

    // 2. Detect Impact (must happen shortly after free-fall)
    if (freefallStartedAt !== null) {
      const sinceFreefall = now - freefallStartedAt;
      
      if (sinceFreefall >= FREEFALL_MIN_MS && sinceFreefall <= IMPACT_WINDOW_MS && magnitude >= impactThreshold) {
        freefallStartedAt = null;
        onFallDetected();
        return;
      }
      
      // If too much time passes, it wasn't a fall (maybe just carrying the phone)
      if (sinceFreefall > IMPACT_WINDOW_MS) {
        freefallStartedAt = null; 
      }
    }
  });
}

export function stopFallDetection(): void {
  subscription?.remove();
  subscription = null;
  freefallStartedAt = null;
}