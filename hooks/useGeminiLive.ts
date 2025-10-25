import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession, Blob } from '@google/genai';
import { playAudio } from '../services/audioService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Decoding/Encoding helpers
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
  
const useGeminiLive = ({ onTurnComplete, onSpeech }: { onTurnComplete: (userPrompt: string) => void; onSpeech: (text: string) => void; }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const currentInputTranscription = useRef('');
    
    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscription.current += text;
            setTranscription(currentInputTranscription.current);
        }
        
        if (message.serverContent?.turnComplete) {
            const fullInputTranscription = currentInputTranscription.current;
            currentInputTranscription.current = '';
            setTranscription('');
            onTurnComplete(fullInputTranscription);
        }

        const modelTurn = message.serverContent?.modelTurn?.parts[0];
        // Check for direct audio data from the Live API
        if (modelTurn?.inlineData?.data) {
            // Play the audio stream directly for real-time response
            await playAudio(modelTurn.inlineData.data);
        } else if (modelTurn?.text) {
           // If the live response is just text, use the separate TTS service to speak it
           onSpeech(modelTurn.text);
        }
    }, [onTurnComplete, onSpeech]);

    const stopRecording = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        setIsRecording(false);
        setTranscription('');
        currentInputTranscription.current = '';
    }, []);

    const handleError = useCallback((e: ErrorEvent) => {
        console.error('Gemini Live Error:', e);
        stopRecording();
    }, [stopRecording]);

    const start = useCallback(async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            setIsRecording(true);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: handleMessage,
                    onerror: handleError,
                    onclose: () => {
                        stopRecording();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
            });

        } catch (error) {
            console.error("Failed to start recording:", error);
            setIsRecording(false);
        }
    }, [isRecording, handleMessage, handleError, stopRecording]);

    const stop = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return { isRecording, transcription, start, stop };
};

export { useGeminiLive };