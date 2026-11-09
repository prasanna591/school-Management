import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { MOTION, NEUTRAL } from "@smartschool/shared";

type SkeletonProps = {
  width: number | "full";
  height: number;
  style?: any;
};

export function Skeleton({ width, height, style }: SkeletonProps) {
  const pulse = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: MOTION.slow,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: width === "full" ? "100%" : width, height },
        { backgroundColor: NEUTRAL[200], opacity },
        style,
      ]}
    />
  );
}

type SkeletonTextProps = {
  lines: number;
  lineHeight?: number;
  width?: number | "full";
  lastLineWidth?: number | "full";
};

export function SkeletonText({
  lines,
  lineHeight = 20,
  width = "full",
  lastLineWidth = "full",
}: SkeletonTextProps) {
  return (
    <View style={styles.textBlock}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : width}
          height={lineHeight}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  textBlock: { gap: 6 },
});
