/**
 * Lightweight Empire Cards presentation motion.
 * Purely visual: never changes run state, input timing, or earned points.
 * All transforms/opacity use the native animation driver and respect reduced motion.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

export function useEmpireReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReduceMotion(value); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      if (mounted) setReduceMotion(value);
    });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduceMotion;
}

export function EmpireScorePulse({ value, reduceMotion, children }: {
  value: number;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);
  useEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    if (!changed) return;
    scale.stopAnimation();
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.075, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
    return () => scale.stopAnimation();
  }, [value, reduceMotion, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

export function EmpirePhaseReveal({ phaseKey, reduceMotion, children }: {
  phaseKey: string;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const previous = useRef(phaseKey);
  useEffect(() => {
    const changed = previous.current !== phaseKey;
    previous.current = phaseKey;
    opacity.stopAnimation();
    translateY.stopAnimation();
    if (!changed || reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    opacity.setValue(0.55);
    translateY.setValue(7);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 185, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 185, useNativeDriver: true }),
    ]).start();
    return () => { opacity.stopAnimation(); translateY.stopAnimation(); };
  }, [phaseKey, reduceMotion, opacity, translateY]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}
