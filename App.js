import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  View,
  Dimensions,
  Text,
  StatusBar,
  TouchableOpacity,
  withSpring,
  Button,
} from 'react-native';
import {PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  useAnimatedGestureHandler,
  withDecay,
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  measure,
} from 'react-native-reanimated';
import Sound from 'react-native-sound';
import useAudio from './hooks/useAudio';
// Enable playback in silence mode

// Load the sound file 'whoosh.mp3' from the app bundle
// See notes below about preloading sounds within initialization code below.

const DIMENSION_VW = Dimensions.get('window').width;
const DIMENSION_VH = Dimensions.get('window').height;

function App() {
  const CARD_DENIED_SOUND = useAudio('card_denied.mp3');
  const CARD_ACCEPTED_SOUND = useAudio('card_accepted.mp3');

  const aref = useAnimatedRef();
  const y = useSharedValue(0);
  const speedData = useSharedValue([]);

  const addVelocityY = (v) => {
    // 'worklet';
    // console.log("Hey I'm running on the UI thread",v);
    speedData.value = [...speedData.value, v];
  };

  const [swipeMsg, setSwipeMsg] = useState('PLEASE SWIPE CARD');
  const isSwipeAccepted = () => {
    let total = 0;
    for (const velocity of speedData.value) {
      total += velocity;
    }

    const averageVelocity = total / speedData.value.length;

    if (averageVelocity > 1000 && averageVelocity < 1300) {
      CARD_ACCEPTED_SOUND.stop();
      CARD_ACCEPTED_SOUND.play();
      setSwipeMsg('ACCEPTED.  THANK YOU');
    } else if (averageVelocity <= 1000) {
      CARD_DENIED_SOUND.stop();
      CARD_DENIED_SOUND.play();
      setSwipeMsg('TOO SLOW.  TRY AGAIN');
    } else {
      CARD_DENIED_SOUND.stop();
      CARD_DENIED_SOUND.play();
      setSwipeMsg('TOO FAST.  TRY AGAIN');
    }
  };

  console.log(Sound.MAIN_BUNDLE);
  const resetSpeedData = () => {
    speedData.value = [];
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(resetSpeedData)();
    },

    onActive: (event) => {
      if (event.translationY >= y.value) {
        y.value = event.translationY;
        runOnJS(addVelocityY)(event.velocityY);
      } else {
        y.value = withTiming(0);
        cancelAnimation(y);
      }
    },
    onEnd: (_) => {
      y.value = withTiming(0);
      runOnJS(isSwipeAccepted)();
    },
    onCancel: () => {
      y.value = withTiming(0);
      runOnJS(isSwipeAccepted)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: y.value,
        },
      ],
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      // enabled={!disabledPanGesture}
      shouldCancelWhenOutside>
      <Animated.View
        style={{
          flex: 1,
          display: 'flex',
        }}
        ref={aref}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          console.log('height:', layout.height);
          console.log('width:', layout.width);
          console.log('x:', layout.x);
          console.log('y:', layout.y);
        }}>
        <Animated.Image
          source={require('./assets/swipe-card.png')}
          style={[
            animatedStyle,
            {
              position: 'absolute',
              height: 200,
              right: '35%',
              width: undefined,
              aspectRatio: 0.6,
            },
          ]}
          resizeMode="center"></Animated.Image>
        <View style={styles.cardMachineCont}>
          <Image
            source={require('./assets/card-machine.png')}
            style={styles.cardMachine}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.swipeMsg}>{swipeMsg}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  cardMachineCont: {
    position: 'absolute',
    right: '5%',
    top: '25%',
  },
  cardMachine: {
    height: DIMENSION_VH / 2,

    aspectRatio: 0.35,
  },

  swipeMsg: {
    fontFamily: 'DSEG14Classic-BoldItalic',
    right: '-37.5%',
    top: '55%',
    transform: [{rotate: '90deg'}],
    color: '#ddd',
    // backgroundColor: '#0f0',
    fontSize: DIMENSION_VH / 50,
    // width:200
  },
});
export default App;
