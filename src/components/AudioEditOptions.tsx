import {FC} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AppButton from './AppButton';
import colors from '../utils/color';

interface Props {
  convertAnother?: boolean;
  disableTrimBtn?: boolean;
  onConvertAnotherPress(): void;
  onSavePress(): void;
  onTrimPress(): void;
}

const AudioEditOptions: FC<Props> = ({
  convertAnother,
  disableTrimBtn,
  onConvertAnotherPress,
  onSavePress,
  onTrimPress,
}) => {
  return (
    <View style={styles.container}>
      {convertAnother ? (
        <AppButton onPress={onConvertAnotherPress}>
          <MaterialIcon color={colors.BASE} name="multitrack-audio" size={25} />
          <Text style={styles.btnTitle}>Convert Another</Text>
        </AppButton>
      ) : (
        <AppButton onPress={onSavePress}>
          <AntDesign color={colors.BASE} name="save" size={25} />
          <Text style={styles.btnTitle}>Save File</Text>
        </AppButton>
      )}

      <AppButton
        onPress={disableTrimBtn ? undefined : onTrimPress}
        style={{marginLeft: 15, opacity: disableTrimBtn ? 0.5 : 1}}>
        <MaterialCommunityIcons
          color={colors.BASE}
          name="scissors-cutting"
          size={25}
        />
        <Text style={styles.btnTitle}>Trim Audio</Text>
      </AppButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  btnTitle: {
    marginLeft: 5,
    color: colors.BASE,
    fontWeight: '600',
  },
});

export default AudioEditOptions;
