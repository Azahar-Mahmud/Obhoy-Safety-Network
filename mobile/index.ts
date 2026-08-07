import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import silentTriggerTask from './src/tasks/silentTriggerTask';

// NEW IMPORTS FOR BATTERY TASK
import * as TaskManager from 'expo-task-manager';
import batteryCheckTaskHandler, { BATTERY_CHECK_TASK } from './src/tasks/batteryCheckTask';

// 1. Register hardware trigger task (from Obhoy_17)
AppRegistry.registerHeadlessTask('ObhoyHardwareTrigger', () => silentTriggerTask);

// 2. Register battery check task (from Obhoy_18)
TaskManager.defineTask(BATTERY_CHECK_TASK, batteryCheckTaskHandler);

// 3. Register the main App
registerRootComponent(App);