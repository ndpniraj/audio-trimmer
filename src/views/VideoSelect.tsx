import {FC} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

import AppButton from '../components/AppButton';
import {openPicker} from 'react-native-image-crop-picker';
import {getPermission} from '../utils/permission';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../navigation';

interface Props {}

const VideoSelect: FC<Props> = props => {
  const {navigate} = useNavigation<NavigationProp<RootStackParamList>>();

  const onVideoSelect = async () => {
    try {
      await getPermission();
      const {sourceURL, path} = await openPicker({mediaType: 'video'});
      const uri = sourceURL || path;
      navigate('VideoConvert', {selectedFileUri: uri});
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={styles.container}>
      <AppButton onPress={onVideoSelect}>
        <IonIcon name="cloud-upload-outline" size={25} color="#2E6EEE" />
        <Text style={styles.btnTitle}>Select a Video File</Text>
      </AppButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTitle: {
    color: '#2E6EEE',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default VideoSelect;
