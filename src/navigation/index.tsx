import {createNativeStackNavigator} from '@react-navigation/native-stack';
import VideoSelect from '../views/VideoSelect';
import VideoConvert from '../views/VideoConvert';
import AudioTrim from '../views/AudioTrim';

export type RootStackParamList = {
  VideoSelect: undefined;
  VideoConvert: {selectedFileUri: string};
  AudioTrim: {samples: number[]; path: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <Stack.Navigator initialRouteName="VideoSelect">
      <Stack.Screen
        name="VideoSelect"
        component={VideoSelect}
        options={{headerTitle: 'Audio Trimmer'}}
      />
      <Stack.Screen
        name="VideoConvert"
        component={VideoConvert}
        options={{headerTitle: 'Video Convert'}}
      />
      <Stack.Screen
        name="AudioTrim"
        component={AudioTrim}
        options={{headerTitle: 'Audio Trim'}}
      />
    </Stack.Navigator>
  );
};

export default Navigation;
