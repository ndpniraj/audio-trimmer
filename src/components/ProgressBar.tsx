import {FC, useEffect} from 'react';
import {View, StyleSheet, Text, StyleProp, ViewStyle} from 'react-native';
import colors from '../utils/color';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  progress: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const ProgressBar: FC<Props> = ({progress, label, style}) => {
  const width = useSharedValue(0);

  const animatedWidth = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  useEffect(() => {
    width.value = withTiming(progress);
  }, [progress]);

  return (
    <View style={style}>
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progress, animatedWidth]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    width: 200,
    height: 10,
    borderWidth: 2,
    borderColor: colors.BASE,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.BASE,
    borderRadius: 5,
  },
  label: {
    color: 'black',
    textAlign: 'center',
    paddingVertical: 5,
  },
});

export default ProgressBar;
