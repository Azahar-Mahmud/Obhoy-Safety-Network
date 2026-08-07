import { NativeModule, requireNativeModule } from 'expo';

declare class LockScreenDisplayModule extends NativeModule<{}> {}

export default requireNativeModule<LockScreenDisplayModule>('LockScreenDisplay');
