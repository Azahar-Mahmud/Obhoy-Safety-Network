import { registerWebModule, NativeModule } from 'expo';

// ObhoyHardwareTriggerModule is not available on the web platform.
class ObhoyHardwareTriggerModule extends NativeModule<{}> {}

export default registerWebModule(ObhoyHardwareTriggerModule, 'ObhoyHardwareTriggerModule');
