import {FC, ReactNode} from 'react';
import {View, StyleSheet, Pressable, StyleProp, ViewStyle} from 'react-native';

interface Props {
  children: ReactNode;
  onPress?(): void;
  style?: StyleProp<ViewStyle>;
}

const AppButton: FC<Props> = ({children, style, onPress}) => {
  return (
    <Pressable onPress={onPress} style={[styles.button, style]}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderRadius: 5,
    padding: 10,
    borderColor: '#2E6EEE',
  },
});

export default AppButton;
