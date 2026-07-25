import { registerWebModule, NativeModule } from 'expo';

class LanMulticastModule extends NativeModule<{}> {}

export default registerWebModule(LanMulticastModule, 'LanMulticastModule');
