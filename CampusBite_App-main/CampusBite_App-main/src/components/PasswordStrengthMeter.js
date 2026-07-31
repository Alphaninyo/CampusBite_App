import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength, PASSWORD_STRENGTH_MAX_SCORE } from '../utils/passwordStrength';

// Shown under any "choose a password" field — sign up, change password,
// reset password. Renders nothing until the user has typed something.
export default function PasswordStrengthMeter({ password, COLORS }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {Array.from({ length: PASSWORD_STRENGTH_MAX_SCORE }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i < score ? color : (COLORS?.border || '#E5E7EB') },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label} password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 6, marginBottom: 4 },
  bars: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '600' },
});
