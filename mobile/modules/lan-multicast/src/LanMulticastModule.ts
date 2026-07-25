import { NativeModule, requireNativeModule } from 'expo';

declare class LanMulticastModule extends NativeModule<{}> {}

export default requireNativeModule<LanMulticastModule>('LanMulticast');
