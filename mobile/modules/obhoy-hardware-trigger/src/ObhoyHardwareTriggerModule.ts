import { NativeModule, requireNativeModule } from 'expo';

declare class ObhoyHardwareTriggerModule extends NativeModule<{}> {}

export default requireNativeModule<ObhoyHardwareTriggerModule>('ObhoyHardwareTrigger');
