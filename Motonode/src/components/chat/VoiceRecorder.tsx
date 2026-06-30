import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const colors = useColors();
  const [recordTime, setRecordTime] = useState('00:00');
  const recorderRef = useRef<AudioRecorderPlayer | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the record dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Handle Recording lifecycle
  useEffect(() => {
    recorderRef.current = new AudioRecorderPlayer();
    
    const startRecord = async () => {
      try {
        const path = Platform.select({
          ios: 'hello.m4a',
          android: undefined,
        });

        await recorderRef.current?.startRecorder(path);
        recorderRef.current?.addRecordBackListener((e) => {
          setRecordTime(recorderRef.current?.mmssss(Math.floor(e.currentPosition)) || '00:00');
        });
      } catch (err) {
        console.error('Failed to start audio recording:', err);
      }
    };

    void startRecord();

    return () => {
      const cleanup = async () => {
        try {
          if (recorderRef.current) {
            await recorderRef.current.stopRecorder();
            recorderRef.current.removeRecordBackListener();
          }
        } catch {
          // ignore
        }
      };
      void cleanup();
    };
  }, []);

  const handleStop = async () => {
    if (!recorderRef.current) return;
    try {
      const resultUri = await recorderRef.current.stopRecorder();
      recorderRef.current.removeRecordBackListener();
      if (resultUri) {
        onRecordingComplete(resultUri);
      } else {
        onCancel();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      onCancel();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.recordStatus}>
        <Animated.View
          style={[
            styles.recordDot,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Text style={[styles.timerText, { color: colors.textPrimary }]}>{recordTime}</Text>
      </View>

      <Text style={[styles.hintText, { color: colors.textSecondary }]}>
        Recording... Tap check mark to send
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: `${colors.destructive}12` }]}
          onPress={onCancel}
        >
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: `${colors.success}12` }]}
          onPress={handleStop}
        >
          <Feather name="check" size={22} color={colors.success} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    height: 60,
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
