import {FC} from 'react';
import {View} from 'react-native';
import {AUDIO_TRIM_SLIDER_PICK_HEIGHT} from './AudioTrimTimelineFun';

interface Props {
  data: number[];
}

const PICK_WIDTH = 3;
const PICK_GAP = 3;
export const PICK_SIZE = PICK_WIDTH + PICK_GAP;

const Picks: FC<Props> = ({data}) => {
  return (
    <>
      {data.map((height, index) => {
        return (
          <View
            style={{
              height: height + 1,
              width: PICK_WIDTH,
              borderRadius: 3,
              backgroundColor: 'rgb(0, 0, 200)',
              marginRight: index === data.length - 1 ? 0 : PICK_GAP, //- - - -//
              top: -(height / 2),
              transform: [{translateY: AUDIO_TRIM_SLIDER_PICK_HEIGHT / 2}],
            }}
            key={index}
          />
        );
      })}
    </>
  );
};

export default Picks;
