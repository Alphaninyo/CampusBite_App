# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Alert.alert with multiple buttons is broken on web

`Alert.alert(title, message, [buttonA, buttonB])` does not render on web — tapping
the button that should trigger it does nothing (no dialog, no error, no network
call). This has caused several silently-broken confirm buttons (see CHANGELOG
`[1.1.0]` and `[1.4.0]`). When adding or touching a confirmation dialog, branch on
`Platform.OS === 'web'` and use `window.confirm(message)` there instead, keeping
`Alert.alert` for native. A single-button `Alert.alert` (just a message, no
branching buttons) is fine on web. Grep for `Alert.alert(` calls with a button
array before assuming an existing one works cross-platform.
