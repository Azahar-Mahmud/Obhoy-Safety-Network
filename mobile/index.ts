import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import silentTriggerTask from './src/tasks/silentTriggerTask';

// 1. Register our background task (must match the name we use in native code later)
AppRegistry.registerHeadlessTask('ObhoyHardwareTrigger', () => silentTriggerTask);

// 2. Register the main App component (standard Expo behavior)
registerRootComponent(App);