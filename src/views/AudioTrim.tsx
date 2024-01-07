import {FC, useState} from 'react';
import {View, StyleSheet, Text, Pressable, Alert} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import rnfs from 'react-native-fs';

import AudioTrimTimelineFun from '../components/AudioTrimTimelineFun';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation';
import Picks, {PICK_SIZE} from '../components/Picks';
import {AUDIO_SAMPLE_SIZE} from './VideoConvert';
import {FFmpegKit} from 'ffmpeg-kit-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'AudioTrim'>;

const sampleToTimestamp = (sample: number, samplePerSecond: number): string => {
  const totalSeconds = sample / samplePerSecond;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiSecond = Math.floor((totalSeconds % 1) * 100);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedCentiSeconds = centiSecond.toString().padStart(2, '0');

  return (
    formattedMinutes + ':' + formattedSeconds + '.' + formattedCentiSeconds
  );
};

const trimAudio = async (path: string, start: string, end: string) => {
  try {
    const downloadDir = rnfs.DownloadDirectoryPath;
    const appName = 'Audio Trimmer';
    const appDir = `${downloadDir}/${appName}`;
    const exists = await rnfs.exists(appDir);
    if (!exists) {
      await rnfs.mkdir(appDir);
    }

    const outputDir = `${downloadDir}/"${appName}/trimmed_${Date.now()}.mp3"`;

    const cmd = `-i ${path} -ss ${start} -to ${end} -c copy ${outputDir}`;
    await FFmpegKit.execute(cmd);
    Alert.alert('File saved to: ' + outputDir);
  } catch (error) {
    console.log('Could not trim: ', error);
  }
};

const AudioTrim: FC<Props> = ({route}) => {
  const {samples, path} = route.params;
  const [value, setValue] = useState({min: 0, max: samples.length});

  return (
    <View style={styles.container}>
      <View style={{height: 100}}>
        <AudioTrimTimelineFun
          min={0}
          max={samples.length}
          step={1}
          timestampStart={sampleToTimestamp(value.min, AUDIO_SAMPLE_SIZE)}
          timestampEnd={sampleToTimestamp(value.max, AUDIO_SAMPLE_SIZE)}
          sliderWidth={samples.length * PICK_SIZE}
          onChangeHandler={values => {
            setValue({...values});
          }}
          renderRails={() => {
            return (
              <View style={{flexDirection: 'row'}}>
                <Picks data={samples} />
              </View>
            );
          }}
        />
      </View>
      <Pressable
        onPress={() =>
          trimAudio(
            path,
            sampleToTimestamp(value.min, AUDIO_SAMPLE_SIZE),
            sampleToTimestamp(value.max, AUDIO_SAMPLE_SIZE),
          )
        }
        style={styles.exportBtn}>
        <AntDesign size={25} name="export" color="black" />
        <Text
          style={{
            fontWeight: '600',
            fontSize: 18,
            marginLeft: 3,
            color: 'black',
          }}>
          Export
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 7,
    padding: 5,
  },
});

export default AudioTrim;
