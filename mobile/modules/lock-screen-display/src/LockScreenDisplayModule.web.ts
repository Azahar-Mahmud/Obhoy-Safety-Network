import { registerWebModule, NativeModule } from 'expo';

// LockScreenDisplayModule is not available on the web platform.
class LockScreenDisplayModule extends NativeModule<{}> {}

export default registerWebModule(LockScreenDisplayModule, 'LockScreenDisplayModule');
