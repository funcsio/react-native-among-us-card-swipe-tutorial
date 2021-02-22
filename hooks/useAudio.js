import {useState, useEffect} from 'react';
import Sound from 'react-native-sound';

const useAudio = (fileName) => {
  const [InitilizedSoundObject, setInitilizedSoundObject] = useState(null);

  useEffect(() => {
    setInitilizedSoundObject(new Sound(fileName));
  }, [fileName]);

  return InitilizedSoundObject;
};

export default useAudio;
