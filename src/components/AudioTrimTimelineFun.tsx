import {FC} from 'react';
import {View, StyleSheet, ScrollView, Text} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Entypo';

interface Props {
  min: number;
  max: number;
  step: number;
  timestampStart: string | number;
  timestampEnd: string | number;
  sliderWidth: number;
  renderRails(): JSX.Element;
  onChangeHandler(values: {min: number; max: number}): void;
}

interface ThumbProps {
  side: 'left' | 'right';
}

const Thumb = ({side}: ThumbProps) => {
  const borderRadius =
    side === 'left'
      ? {borderTopLeftRadius: 10, borderBottomLeftRadius: 10}
      : {borderTopRightRadius: 10, borderBottomRightRadius: 10};

  const iconName = side === 'left' ? 'chevron-left' : 'chevron-right';

  return (
    <View
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        height: '100%',
        justifyContent: 'center',
        transform: [{translateX: side === 'left' ? -10 : 10}],
        ...borderRadius,
      }}>
      <Icon name={iconName} size={24} color="white" />
    </View>
  );
};

export const AUDIO_TRIM_SLIDER_HEIGHT = 40;
export const AUDIO_TRIM_SLIDER_PICK_HEIGHT = 30;

type calculateMinMaxOptions = {
  minPositionValue: number;
  maxPositionValue: number;
  maxSliderWidth: number;
  min: number;
  max: number;
  step: number;
};

const calculateMinMaxValue = (options: calculateMinMaxOptions) => {
  'worklet';
  const {min, max, step, minPositionValue, maxPositionValue, maxSliderWidth} =
    options;

  const minSliderValueNormalized = minPositionValue / maxSliderWidth;
  const stepsInRange = (max - min) / step;
  const stepsFromMin = minSliderValueNormalized * stepsInRange;
  const roundedStepsMin = Math.floor(stepsFromMin);
  const minValue = min + roundedStepsMin * step;

  const maxSliderValueNormalized = maxPositionValue / maxSliderWidth;
  const stepsFromMax = maxSliderValueNormalized * stepsInRange;
  const roundedStepsMax = Math.floor(stepsFromMax);
  const maxValue = min + roundedStepsMax * step;

  return {min: minValue, max: maxValue};
};

const AudioTrimTimelineFun: FC<Props> = ({
  sliderWidth,
  min,
  max,
  step,
  timestampEnd,
  timestampStart,
  renderRails,
  onChangeHandler,
}) => {
  const minPosition = useSharedValue(0);
  const maxPosition = useSharedValue(sliderWidth);

  // To Handle Gesture for Min
  const gestureHandlerMin = useAnimatedGestureHandler({
    onStart(evt, ctx: {startX: number}) {
      ctx.startX = minPosition.value;
    },
    onActive(evt, ctx) {
      const combinedPosition = ctx.startX + evt.translationX;
      const minClamp = 0;
      const maxClamp = maxPosition.value - 50;
      minPosition.value = Math.max(
        minClamp,
        Math.min(combinedPosition, maxClamp),
      );
    },
    onEnd() {
      // const minValue = min + Math.floor((minPosition.value / sliderWidth) * ((max - min) / step)) * step;
      // const maxValue = min + Math.floor((maxPosition.value / sliderWidth) * ((max - min) / step)) * step;

      // const minSliderValueNormalized = minPosition.value / sliderWidth;
      // const stepsInRange = (max - min) / step;
      // const stepsFromMin = minSliderValueNormalized * stepsInRange;
      // const roundedStepsMin = Math.floor(stepsFromMin);
      // const minValue = min + roundedStepsMin * step;

      // const maxSliderValueNormalized = maxPosition.value / sliderWidth;
      // const stepsFromMax = maxSliderValueNormalized * stepsInRange;
      // const roundedStepsMax = Math.floor(stepsFromMax);
      // const maxValue = min + roundedStepsMax * step;

      const values = calculateMinMaxValue({
        min,
        max,
        minPositionValue: minPosition.value,
        maxPositionValue: maxPosition.value,
        step,
        maxSliderWidth: sliderWidth,
      });

      runOnJS(onChangeHandler)(values);
    },
  });

  const animatedStyleMin = useAnimatedStyle(() => {
    return {
      transform: [{translateX: minPosition.value}],
    };
  });

  // To Handle Gesture for Max
  const gestureHandlerMax = useAnimatedGestureHandler({
    onStart(evt, ctx: {startX: number}) {
      ctx.startX = maxPosition.value;
    },
    onActive(evt, ctx) {
      const combinedPosition = ctx.startX + evt.translationX;
      const minClamp = minPosition.value + 50;
      const maxClamp = sliderWidth;

      maxPosition.value = Math.max(
        minClamp,
        Math.min(combinedPosition, maxClamp),
      );
    },
    onEnd() {
      const values = calculateMinMaxValue({
        min,
        max,
        minPositionValue: minPosition.value,
        maxPositionValue: maxPosition.value,
        step,
        maxSliderWidth: sliderWidth,
      });

      runOnJS(onChangeHandler)(values);
    },
  });

  const animatedStyleMax = useAnimatedStyle(() => {
    return {
      transform: [{translateX: maxPosition.value}],
    };
  });

  const sliderStyle = useAnimatedStyle(() => {
    return {
      width: maxPosition.value - minPosition.value,
      transform: [{translateX: minPosition.value}],
    };
  });

  const innerSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: -minPosition.value}],
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.timestampContainer}>
        <Text style={styles.timestamps}>{timestampStart}</Text>
        <Text style={styles.timestamps}>{timestampEnd}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.inactiveRailSlider, {width: sliderWidth}]}>
          {renderRails()}
        </View>

        <Animated.View style={[sliderStyle, styles.activeRailSlider]}>
          <Animated.View style={[innerSliderStyle, styles.trimmedArea]}>
            {renderRails()}
          </Animated.View>
        </Animated.View>

        {/* Thumb Left */}
        <PanGestureHandler onGestureEvent={gestureHandlerMin}>
          <Animated.View style={[animatedStyleMin, {...styles.thumb, left: 0}]}>
            <Thumb side="left" />
          </Animated.View>
        </PanGestureHandler>

        {/* Thumb Right */}
        <PanGestureHandler onGestureEvent={gestureHandlerMax}>
          <Animated.View style={[styles.thumb, animatedStyleMax]}>
            <Thumb side="right" />
          </Animated.View>
        </PanGestureHandler>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const THUMB_SIZE = 40;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},
  inactiveRailSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AUDIO_TRIM_SLIDER_HEIGHT,
    backgroundColor: '#DFEAFB',
    opacity: 0.3,
  },
  trimmedArea: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AUDIO_TRIM_SLIDER_HEIGHT,
    position: 'absolute',
  },
  activeRailSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AUDIO_TRIM_SLIDER_HEIGHT,
    backgroundColor: 'rgba(0, 0, 200, 0.2)',
    position: 'absolute',
    width: '50%',
    overflow: 'hidden',
  },
  thumb: {
    left: -THUMB_SIZE,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: 'transparent',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timestamps: {
    fontWeight: '600',
    color: 'black',
  },
});

export default AudioTrimTimelineFun;
