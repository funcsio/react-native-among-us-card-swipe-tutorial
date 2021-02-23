import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Image,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import {PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedGestureHandler,
  cancelAnimation,
  runOnJS,
  useAnimatedRef,
  measure,
} from 'react-native-reanimated';
import useAudio from './hooks/useAudio';

const DIMENSION_VW = Dimensions.get('window').width;
const DIMENSION_VH = Dimensions.get('window').height;

function App() {
  const CARD_DENIED_SOUND = useAudio('card_denied.mp3');
  const CARD_ACCEPTED_SOUND = useAudio('card_accepted.mp3');

  const [IndicatorLight, setIndicatorLight] = useState(0); // 0 -> No Light  1 -> Red   2-> Green

  const CardMachineRef = useAnimatedRef();
  const CardRef = useAnimatedRef();
  const X = useSharedValue(0);
  const speedData = useSharedValue([]);

  const addVelocityX = (v) => {
    speedData.value = [...speedData.value, v];
  };

  const [swipeMsg, setSwipeMsg] = useState('PLEASE SWIPE CARD');
  const badRead = () => {
    CARD_DENIED_SOUND.stop();
    CARD_DENIED_SOUND.play();
    setSwipeMsg('BAD READ.  TRY AGAIN');
    setIndicatorLight(1);
  };
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
      setIndicatorLight(2);
    } else if (averageVelocity <= 1000) {
      CARD_DENIED_SOUND.stop();
      CARD_DENIED_SOUND.play();
      setSwipeMsg('TOO SLOW.  TRY AGAIN');
      setIndicatorLight(1);
    } else {
      CARD_DENIED_SOUND.stop();
      CARD_DENIED_SOUND.play();
      setSwipeMsg('TOO FAST.  TRY AGAIN');
      setIndicatorLight(1);
    }
  };

  const resetSpeedData = () => {
    speedData.value = [];
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(resetSpeedData)();
    },

    onActive: (event, ctx) => {
      ctx.x = event.translationX;
      if (event.translationX >= X.value) {
        X.value = event.translationX;
        runOnJS(addVelocityX)(event.velocityX);
      } else {
        X.value = withTiming(0);
        cancelAnimation(X);
      }
    },
    onEnd: (_, ctx) => {
      X.value = withTiming(0);

      const SwipeMachineLayout = measure(CardMachineRef);
      const CardLayout = measure(CardRef);

      if (
        ctx.x + CardLayout.width <
        (SwipeMachineLayout.pageX + SwipeMachineLayout.width) * 0.95
      ) {
        runOnJS(badRead)();
      } else {
        runOnJS(isSwipeAccepted)();
      }
    },
    onCancel: () => {
      X.value = withTiming(0);
      runOnJS(isSwipeAccepted)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: X.value,
        },
      ],
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      // enabled={!disabledPanGesture}
    >
      <Animated.View style={styles.root}>
        <Image
          source={require('./assets/background.jpg')}
          style={styles.background}
          resizeMode="cover"
        />

        <Animated.Image
          source={require('./assets/swipe-card.png')}
          style={[animatedStyle, styles.card]}
          resizeMode="center"
          ref={CardRef}
        />

        <Image source={require('./assets/wallet.png')} style={styles.wallet} />
        <View style={styles.cardMachineCont}>
          <Image
            ref={CardMachineRef}
            source={require('./assets/card-machine.png')}
            style={styles.cardMachine}
            resizeMode="contain"
          />
          <View style={styles.lightsCont}>
            <Image
              source={require('./assets/red.png')}
              style={[styles.light, {opacity: IndicatorLight === 1 ? 1 : 0.3}]}
            />
            <Image
              source={require('./assets/green.png')}
              style={[styles.light, {opacity: IndicatorLight === 2 ? 1 : 0.3}]}
            />
          </View>
          <Text style={styles.swipeMsg}>{swipeMsg}</Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    display: 'flex',
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    flex: 1,
    width: DIMENSION_VW,
    height: DIMENSION_VH,
    opacity: 0.4,
  },
  wallet: {
    position: 'absolute',
    zIndex: 2,
    width: DIMENSION_VW / 2.5,
    height: undefined,
    aspectRatio: 2,
    left: '-4%',
    bottom: '-15%',
    transform: [{rotateZ: '5deg'}],
  },

  card: {
    position: 'absolute',
    left: 10,
    top: '30%',
    height: 100,
    width: 150,
    aspectRatio: 0.2,
  },
  cardMachineCont: {
    flex: 1,
  },
  cardMachine: {
    position: 'absolute',
    top: 0,
    height: DIMENSION_VH / 3,
    width: undefined,
    aspectRatio: 2.9,
    alignSelf: 'center',
  },
  lightsCont: {
    position: 'absolute',
    top: '22%',
    display: 'flex',
    right: '29%',
    flexDirection: 'row',
  },
  light: {
    marginHorizontal: 2,
  },

  swipeMsg: {
    fontFamily: 'DSEG14Classic-BoldItalic',
    left: '32%',
    top: '5%',
    color: '#ddd',
    fontSize: DIMENSION_VW / 50,
    letterSpacing: 1.2,
  },
});
export default App;
