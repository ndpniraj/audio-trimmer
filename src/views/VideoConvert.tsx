import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FC, useState} from 'react';
import {View, StyleSheet, Text, Alert} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import rnfs from 'react-native-fs';
import {FFmpegKit, FFprobeKit, ReturnCode} from 'ffmpeg-kit-react-native';

import {RootStackParamList} from '../navigation';
import AppButton from '../components/AppButton';
import colors from '../utils/color';
import ProgressBar from '../components/ProgressBar';
import AudioEditOptions from '../components/AudioEditOptions';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {AUDIO_TRIM_SLIDER_PICK_HEIGHT} from '../components/AudioTrimTimelineFun';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoConvert'>;

type nameWithExtension = {
  name: string;
  extension: string;
};

export const AUDIO_SAMPLE_SIZE = 15;

const extractNameFromFileUrl = (
  uri: string,
  config?: {trimExt?: boolean; separateBoth?: boolean},
) => {
  const splittedUri = uri.split('/');
  const fullName = splittedUri[splittedUri.length - 1];
  const fileName = fullName.split('.')[0];
  const fileExtension = fullName.split('.')[1];

  let newFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_'); // replace non-alphanumeric (. , -) characters with _
  newFileName = newFileName.replace(/\s+/g, '_'); // replace spaces with _

  if (config?.separateBoth)
    return {
      name: newFileName,
      extension: fileExtension,
    };

  if (config?.trimExt) return newFileName;

  return `${newFileName}.${fileExtension}`;
};

type options = {
  value: number;
  inputMin: number;
  inputMax: number;
  outputMin: number;
  outputMax: number;
};
// 250 0 500 0% 100% => 50%
const mapRange = (options: options) => {
  const {value, inputMax, inputMin, outputMin, outputMax} = options;
  const result =
    ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) +
    outputMin;

  if (result === Infinity || result < outputMin) return outputMin;
  if (result > outputMax) return outputMax;

  return result;
};

const extractAudioSampleAndSave = async (filePath: string) => {
  try {
    const cacheDir = rnfs.CachesDirectoryPath;
    const fileName = `${Date.now()}_log.txt`;
    const outputPath = `${cacheDir}/${fileName}`;

    const samples = 44100 / AUDIO_SAMPLE_SIZE;
    const cmd = `-i ${filePath} -af asetnsamples=${samples},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=${outputPath} -f null -`;

    await FFmpegKit.execute(cmd);
    return outputPath;
  } catch (error) {
    console.log('Error while extracting audio samples: ', error);
  }
};

type mapRMSOptions = {
  rmsLevel: number;
  minRMS: number;
  maxRMS: number;
  minHeight: number;
  maxHeight: number;
};

// [0, 30] [0, -71]
const mapRMSLevelsToHeight = (options: mapRMSOptions) => {
  const {rmsLevel, minRMS, maxRMS, minHeight, maxHeight} = options;

  // to calculate values from 0 to 1 according to the rmsLevel
  // if you have 0 inside your rmsLevel that is the loudest part of your audio
  const position = (rmsLevel - minRMS) / (maxRMS - minRMS);
  const height = position * (maxHeight - minHeight) + minHeight;
  return height;
};

const filterAudioSamplesFromFile = async (filePath: string) => {
  try {
    const data = await rnfs.readFile(filePath, 'utf8');
    const lines = data.split('\n');

    const levels: number[] = [];

    lines.forEach(line => {
      if (line.includes('RMS_level')) {
        const level = line.split('RMS_level=')[1];
        levels.push(parseFloat(level));
      }
    });

    const minHeight = 0;
    const maxHeight = AUDIO_TRIM_SLIDER_PICK_HEIGHT;

    // if you have NaN inside your levels you will get all the samples as NaN because we are using Math.min and max and those values will be NaN

    // [NaN, -79.232, ]

    const levelsWithPureNumbers = levels.filter(level => {
      if (!isNaN(level)) {
        // !isNaN(12) => true  !isNaN(NaN) => false
        return level;
      }
    });

    const minRMS = Math.min(...levelsWithPureNumbers); // 0 , -10, -15 => -15 is the smaller
    const maxRMS = Math.max(...levelsWithPureNumbers); // 0 , -10, -15 => 0 is the highest

    const samples = levels.map(rmsLevel => {
      const level = isNaN(rmsLevel) ? minRMS : rmsLevel;
      return mapRMSLevelsToHeight({
        rmsLevel: level,
        maxHeight,
        minHeight,
        maxRMS,
        minRMS,
      });
    });

    return samples;
  } catch (error) {
    console.log('Error inside {filterAudioSamplesFromFile} ', error);
    return [];
  }
};

type FileInfo = {path: string; name: string; samplePath?: string};
const VideoConvert: FC<Props> = props => {
  const [progress, setProgress] = useState(0);
  const [fileSaved, setFileSaved] = useState(false);
  const [isSamplingFinish, setIsSamplingFinish] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo>({name: '', path: ''});
  const {navigate} = useNavigation<NavigationProp<RootStackParamList>>();
  const uri = props.route.params.selectedFileUri;

  const convertToAudio = async () => {
    try {
      // input url => coping the uri inside our cache dir
      const {name, extension} = extractNameFromFileUrl(uri, {
        separateBoth: true,
      }) as nameWithExtension;
      const uniqueFileName = `${name}_${Date.now()}.${extension}`; // 'fileName_1234787.mp4';
      const cacheDir = rnfs.CachesDirectoryPath;
      const uniqueFilePath = `${cacheDir}/${uniqueFileName}`;

      await rnfs.copyFile(uri, uniqueFilePath);

      const mediaInfo = await FFprobeKit.getMediaInformation(uniqueFilePath);
      const output = await mediaInfo.getOutput();
      const durationInMillis = JSON.parse(output).format.duration * 1000;

      const uniqueOutputName = `${name}_${Date.now()}.mp3`;
      const outputPath = `${cacheDir}/${uniqueOutputName}`;

      const command = `-i ${uniqueFilePath} -vn -acodec libmp3lame -qscale:a 2 ${outputPath}`;

      await FFmpegKit.executeAsync(
        command,
        async session => {
          const returnCode = await session.getReturnCode();

          if (ReturnCode.isSuccess(returnCode)) {
            const samplePath = await extractAudioSampleAndSave(outputPath);
            setIsSamplingFinish(true);
            setFileInfo({
              name: uniqueOutputName,
              path: outputPath,
              samplePath,
            });
          } else if (ReturnCode.isCancel(returnCode)) {
            console.log('Just canceled');
          } else {
            Alert.alert("Can't convert, something went wrong!");
          }
        },
        log => {
          console.log(log.getMessage());
        },
        statistics => {
          const progress = Math.round(
            mapRange({
              value: statistics.getTime(),
              inputMin: 0,
              inputMax: durationInMillis,
              outputMin: 0,
              outputMax: 100,
            }),
          );

          setProgress(progress);
        },
      );

      // output url => unique name with the output path
    } catch (error) {
      console.log('Error while converting: ', error);
    }
  };

  const onConvertAnotherPress = () => {
    navigate('VideoSelect');
  };

  const downloadAudio = async () => {
    try {
      if (!fileInfo.name || !fileInfo.path) return;

      const appDir = `${rnfs.DownloadDirectoryPath}/Audio Trimmer`;
      const exists = await rnfs.exists(appDir);
      if (!exists) {
        await rnfs.mkdir(appDir);
      }

      await rnfs.copyFile(fileInfo.path, `${appDir}/${fileInfo.name}`);
      Alert.alert('Saved your file to : ' + appDir);
      setFileSaved(true);
    } catch (error) {
      console.log('Failed to save file: ', error);
    }
  };

  const handleOnTrimPress = async () => {
    if (!fileInfo.samplePath) return;

    const samples = await filterAudioSamplesFromFile(fileInfo.samplePath);
    navigate('AudioTrim', {samples, path: fileInfo.path});
  };

  return (
    <View style={styles.container}>
      {!progress ? (
        <AppButton onPress={convertToAudio}>
          <MaterialIcons
            name="multitrack-audio"
            size={25}
            color={colors.BASE}
          />
          <Text style={styles.btnTitle}>Convert File</Text>
        </AppButton>
      ) : null}

      {progress >= 100 ? (
        <AudioEditOptions
          convertAnother={fileSaved}
          disableTrimBtn={!isSamplingFinish}
          onSavePress={downloadAudio}
          onConvertAnotherPress={onConvertAnotherPress}
          onTrimPress={handleOnTrimPress}
        />
      ) : (
        <ProgressBar
          style={{marginVertical: 15}}
          progress={progress}
          label={`${progress}% Completed`}
        />
      )}
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
    marginLeft: 5,
    color: colors.BASE,
    fontWeight: '600',
  },
});

export default VideoConvert;

/*
30
0
samples = []
frame:0    pts:0       pts_time:0
lavfi.astats.Overall.RMS_level=-79.382195

frame:1    pts:2940    pts_time:0.0666667
lavfi.astats.Overall.RMS_level=-50.617520

frame:2    pts:5880    pts_time:0.133333
lavfi.astats.Overall.RMS_level=-29.513323

frame:3    pts:8820    pts_time:0.2
lavfi.astats.Overall.RMS_level=-22.041706

frame:4    pts:11760   pts_time:0.266667
lavfi.astats.Overall.RMS_level=-14.843667
*/
