"use client";

import { useRef } from "react";

interface AudioProcessorProps {
  selectedOperator?: string;
  selectedCategory?: string;
  onTTSStart: () => void;
  onTTSEnd: () => void;
  onTTSError: () => void;
}

interface ConversationMessage {
  role: string;
  content: string;
}

export default function AudioProcessor({
  selectedOperator,
  selectedCategory,
  onTTSStart,
  onTTSEnd,
  onTTSError,
}: AudioProcessorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Process audio with OpenAI Whisper
  const processAudioWithWhisper = async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('🎧 AudioProcessor: Starting Whisper transcription...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const { text } = await response.json();
      console.log('🎧 AudioProcessor: Whisper transcription result:', text);
      
      return text.trim();
    } catch (error) {
      console.error('🎧 AudioProcessor: Whisper transcription error:', error);
      throw error;
    }
  };

  // Generate AI response
  const generateAIResponse = async (
    message: string,
    conversation: ConversationMessage[]
  ): Promise<string> => {
    try {
      console.log('🧠 AudioProcessor: Getting AI response...');
      
      // Get AI response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          operator: selectedOperator,
          category: selectedCategory,
          conversation, // Pass conversation history for context
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const { text: aiResponse } = await chatResponse.json();
      console.log('🧠 AudioProcessor: AI response generated:', aiResponse.substring(0, 100) + '...');
      
      return aiResponse;
    } catch (error) {
      console.error("🧠 AudioProcessor: Error generating AI response:", error);
      throw error;
    }
  };

  // Convert text to speech
  const convertToSpeech = async (text: string): Promise<void> => {
    try {
      console.log('🔊 AudioProcessor: Converting to speech...');
      
      // Convert to speech
      const ttsResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          category: selectedCategory,
        }),
      });

      if (ttsResponse.ok && audioRef.current) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        console.log('🔊 AudioProcessor: AI starting to speak');
        onTTSStart();
        
        audioRef.current.src = audioUrl;
        
        // Listen for when audio finishes
        audioRef.current.onended = () => {
          console.log('🔇 AudioProcessor: AI finished speaking');
          onTTSEnd();
        };
        
        audioRef.current.onerror = () => {
          console.log('❌ AudioProcessor: AI audio error');
          onTTSError();
        };
        
        await audioRef.current.play();
      } else {
        console.log('⚠️ AudioProcessor: No TTS audio available');
        onTTSError();
      }
    } catch (error) {
      console.error('🔊 AudioProcessor: Error converting to speech:', error);
      onTTSError();
      throw error;
    }
  };

  // Generate AI initial greeting
  const generateInitialGreeting = async (): Promise<void> => {
    try {
      console.log('👋 AudioProcessor: Starting AI initial greeting...');
      
      // Generate personalized greeting based on operator and category
      let greetingText = "Benvenuto, sono qui per aiutarti. Cosa ti preoccupa oggi?";
      
      if (selectedOperator && selectedCategory) {
        greetingText = `Ciao, sono ${selectedOperator}. Vedo che hai scelto una consulenza su ${selectedCategory.toLowerCase()}. Dimmi, cosa ti porta da me oggi?`;
      } else if (selectedOperator) {
        greetingText = `Salve, sono ${selectedOperator}. Sono qui per guidarti. Parlami di ciò che ti sta a cuore.`;
      } else if (selectedCategory) {
        greetingText = `Benvenuto. Vedo che cerchi una consulenza su ${selectedCategory.toLowerCase()}. Raccontami la tua situazione.`;
      }
      
      console.log('👋 AudioProcessor: AI greeting message:', greetingText);
      
      // Convert greeting to speech
      await convertToSpeech(greetingText);
    } catch (error) {
      console.error('👋 AudioProcessor: Error with initial greeting:', error);
      onTTSError();
    }
  };

  // Process complete conversation flow: audio -> text -> AI -> speech
  const processConversationFlow = async (
    audioBlob: Blob,
    conversation: ConversationMessage[]
  ): Promise<{ userMessage: string; aiResponse: string }> => {
    try {
      // Step 1: Transcribe audio
      const userMessage = await processAudioWithWhisper(audioBlob);
      
      if (!userMessage) {
        throw new Error('No text detected from audio');
      }
      
      // Step 2: Generate AI response
      const aiResponse = await generateAIResponse(userMessage, conversation);
      
      // Step 3: Convert AI response to speech
      await convertToSpeech(aiResponse);
      
      return { userMessage, aiResponse };
    } catch (error) {
      console.error('🔄 AudioProcessor: Error in conversation flow:', error);
      throw error;
    }
  };

  return {
    processAudioWithWhisper,
    generateAIResponse,
    convertToSpeech,
    generateInitialGreeting,
    processConversationFlow,
    audioRef,
  };
}