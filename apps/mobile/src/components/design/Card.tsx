import { StyleSheet, View } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS } from "@smartschool/shared";

type CardProps = {
  children: React.ReactNode;
  style?: any;
  elevated?: boolean;
};

export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View
      style={[
        styles.container,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type CardBodyProps = {
  children: React.ReactNode;
};

export function CardBody({ children }: CardBodyProps) {
  return <View style={styles.body}>{children}</View>;
}

type CardFooterProps = {
  children: React.ReactNode;
};

export function CardFooter({ children }: CardFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIGHT_THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: LIGHT_THEME.border,
    overflow: "hidden",
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  body: { padding: SPACING.md },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: LIGHT_THEME.border,
    backgroundColor: LIGHT_THEME.background,
  },
});
