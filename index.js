/**
 * @format
 */

// Import the buffer polyfill first to ensure it's loaded globally
import './src/utils/bufferPolyfill';

import {AppRegistry, Text, TextInput} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';

// Import Reanimated to ensure it's properly initialized
import { LogBox } from 'react-native';

// Fix potential text coloring issues in React Native
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

// Ignore specific Reanimated warnings if any
LogBox.ignoreLogs([
  'Reanimated 2',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

AppRegistry.registerComponent(appName, () => App);
