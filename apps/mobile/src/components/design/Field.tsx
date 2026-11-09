import { StyleSheet, View, Text, TextInput } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "numeric" | "email-address" | "default" | "phone-pad";
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
}: FieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && { borderColor: LIGHT_THEME.danger.base },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    color: LIGHT_THEME.text,
  },
  input: {
    backgroundColor: LIGHT_THEME.background,
    borderWidth: 1,
    borderColor: LIGHT_THEME.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.body,
    color: LIGHT_THEME.text,
    minHeight: 44,
  },
  error: {
    fontSize: FONT_SIZE.caption,
    color: LIGHT_THEME.danger.base,
    marginTop: 2,
  },
});
