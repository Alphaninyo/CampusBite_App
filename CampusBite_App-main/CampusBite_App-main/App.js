import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// "auto" follows the phone's system-wide light/dark setting, not the app's
// own theme toggle — mismatched, that leaves status bar icons the same
// color as the background (invisible). Bind it to the app's theme instead.
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
