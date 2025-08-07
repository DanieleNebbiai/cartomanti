"use client";

import { useState, useRef, useCallback } from "react";

interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob) => Promise<void>;
  isAISpeaking: boolean;
  isFirstUserInput: boolean;
  onFirstUserInputChange: (value: boolean) => void;
  onListeningChange: (isListening: boolean) => void;
  onRecordingChange: (isRecording: boolean) => void;
}

export default function VoiceRecorder({
  onAudioReady,
  isAISpeaking,
  isFirstUserInput,
  onFirstUserInputChange,
  onListeningChange,
  onRecordingChange,
}: VoiceRecorderProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  // Initialize MediaRecorder for OpenAI Whisper
  const initializeMediaRecorder = async () => {
    try {
      console.log('🎤 VoiceRecorder: Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 VoiceRecorder: Microphone access granted');
      
      streamRef.current = stream;
      
      // Set up audio context for voice activity detection
      console.log('🎤 VoiceRecorder: Setting up AudioContext for VAD...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🎤 VoiceRecorder: AudioContext resumed');
      }
      
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      // Optimized settings for human voice detection and noise reduction
      analyser.fftSize = 1024; // Smaller for faster processing
      analyser.minDecibels = -60; // Higher minimum to filter out low-level noise
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.9; // More smoothing to reduce noise spikes
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      console.log('🎤 VoiceRecorder: AudioContext setup complete:', {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate,
        bufferSize: analyser.frequencyBinCount
      });
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }
      
      console.log('🎤 VoiceRecorder: Using MIME type:', mimeType);
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('🎤 VoiceRecorder: Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('🎤 VoiceRecorder: Total chunks now:', audioChunksRef.current.length);
        } else {
          console.log('🎤 VoiceRecorder: Warning: received 0-size audio chunk');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎤 VoiceRecorder: MediaRecorder started');
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 VoiceRecorder: MediaRecorder ONSTOP EVENT FIRED');
        console.log('🎤 VoiceRecorder: Processing audio chunks count:', audioChunksRef.current.length);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          console.log('🎤 VoiceRecorder: Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          audioChunksRef.current = [];
          
          if (audioBlob.size > 0) {
            console.log('🎤 VoiceRecorder: Sending audio to parent component...');
            await onAudioReady(audioBlob);
            console.log('🎤 VoiceRecorder: Audio processing completed');
          } else {
            console.error('🎤 VoiceRecorder: No audio data recorded - blob size is 0');
          }
        } catch (error) {
          console.error('🎤 VoiceRecorder: Error in onstop handler:', error);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      setHasPermission(true);
      console.log('🎤 VoiceRecorder: MediaRecorder initialized successfully');
      
      return true;
    } catch (error) {
      console.error('🎤 VoiceRecorder: Error initializing media recorder:', error);
      setHasPermission(false);
      cleanup();
      return false;
    }
  };

  // Voice Activity Detection with debugging
  const detectSilence = useCallback(() => {
    if (!analyserRef.current) {
      console.log('🎤 VoiceRecorder: VAD stopped: no analyser');
      return;
    }
    
    // Use MediaRecorder state instead of React state to avoid timing issues
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('🎤 VoiceRecorder: VAD stopped: MediaRecorder state=', mediaRecorderRef.current?.state, '(should be recording)');
      return;
    }
    
    // Don't process audio while AI is speaking
    if (isAISpeaking) {
      // Continue monitoring but don't trigger on audio while AI speaks
      if (mediaRecorderRef.current?.state === 'recording') {
        requestAnimationFrame(detectSilence);
      }
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Focus on human voice frequency range (roughly 80Hz-8kHz)
    // With 1024 fftSize and typical 44.1kHz sample rate, we want bins ~4-180
    const voiceStart = Math.floor(bufferLength * 0.02); // ~80Hz
    const voiceEnd = Math.floor(bufferLength * 0.36);   // ~8kHz
    
    // Calculate average volume only in voice frequency range
    let sum = 0;
    let count = 0;
    for (let i = voiceStart; i < voiceEnd && i < bufferLength; i++) {
      sum += dataArray[i];
      count++;
    }
    const average = count > 0 ? sum / count : 0;
    
    // Much more lenient thresholds to prevent sentence truncation
    const silenceThreshold = 4; // Very low to only detect true silence
    const minimumSpeechLevel = 2; // Very low minimum to catch whispers
    
    // Log audio levels more frequently for debugging
    if (Date.now() % 1000 < 100) {
      console.log('🎤 VoiceRecorder: Audio level:', Math.round(average), 'silence threshold:', silenceThreshold, 'min level:', minimumSpeechLevel, 'AI speaking:', isAISpeaking);
    }
    
    if (average < silenceThreshold || average < minimumSpeechLevel) {
      // User is silent or audio too weak, start/continue silence timer
      if (!silenceTimeoutRef.current) {
        if (average > 3) { // Only log if there's some audio activity
          console.log('🎤 VoiceRecorder: Starting silence timer, level:', Math.round(average), '(below', silenceThreshold, 'threshold)');
        }
        
        // Much longer timeout to prevent truncation of longer sentences
        const timeoutDuration = 6000; // 6 seconds to allow for longer pauses and sentences
        
        console.log('🎤 VoiceRecorder: Starting', timeoutDuration/1000, 'second silence timer');
        
        // Set main timeout - always process audio
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('🎤 VoiceRecorder:', timeoutDuration/1000, 'seconds of silence - stopping recording and processing audio');
          
          try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              console.log('🎤 VoiceRecorder: Stopping MediaRecorder');
              mediaRecorderRef.current.stop();
              onRecordingChange(false);
              onListeningChange(false);
              
              // Clear timeout
              if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
              }
              
              console.log('🎤 VoiceRecorder: MediaRecorder stopped - audio will be processed by onstop event');
            }
          } catch (error) {
            console.error('🎤 VoiceRecorder: Error stopping recording:', error);
          }
        }, timeoutDuration);
      }
    } else {
      // User is speaking clearly (above both thresholds), cancel silence timer
      lastSpeechTimeRef.current = Date.now(); // Track when we last detected speech
      
      // Mark that user has started speaking (for shorter timeouts in future)
      if (isFirstUserInput) {
        console.log('🎤 VoiceRecorder: First user speech detected - switching to normal conversation timeouts');
        onFirstUserInputChange(false);
      }
      
      if (silenceTimeoutRef.current) {
        console.log('🎤 VoiceRecorder: Clear speech detected, canceling all timers, level:', Math.round(average));
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
    
    // Continue monitoring if MediaRecorder is still recording
    if (mediaRecorderRef.current?.state === 'recording') {
      requestAnimationFrame(detectSilence);
    } else {
      console.log('🎤 VoiceRecorder: VAD loop stopped - MediaRecorder state:', mediaRecorderRef.current?.state);
    }
  }, [isAISpeaking, isFirstUserInput, onFirstUserInputChange, onListeningChange, onRecordingChange]);

  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      const initialized = await initializeMediaRecorder();
      if (!initialized) {
        console.error('🎤 VoiceRecorder: Failed to initialize MediaRecorder');
        return false;
      }
    }
    
    console.log('🎤 VoiceRecorder: Starting recording...');
    audioChunksRef.current = [];
    
    try {
      mediaRecorderRef.current!.start();
      onRecordingChange(true);
      onListeningChange(true);
      
      // Start voice activity detection with debugging
      console.log('🎤 VoiceRecorder: Starting VAD system...');
      setTimeout(() => {
        console.log('🎤 VoiceRecorder: VAD system activated');
        detectSilence();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('🎤 VoiceRecorder: Failed to start recording:', error);
      onRecordingChange(false);
      onListeningChange(false);
      return false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('🎤 VoiceRecorder: stopRecording called');
      mediaRecorderRef.current.stop();
      onRecordingChange(false);
      onListeningChange(false);
      
      // Clear timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      console.log('🎤 VoiceRecorder: Recording stopped, processing with Whisper...');
    }
  };

  const cleanup = () => {
    console.log('🎤 VoiceRecorder: Cleaning up resources...');
    
    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  };

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error("🎤 VoiceRecorder: Microphone permission denied:", error);
      setHasPermission(false);
      return false;
    }
  };

  return {
    hasPermission,
    startRecording,
    stopRecording,
    cleanup,
    checkMicrophonePermission,
    initializeMediaRecorder,
  };
}