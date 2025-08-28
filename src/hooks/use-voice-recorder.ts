import { useRef, useState, useCallback } from "react";
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface UseVoiceRecorderResult {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<string | null>;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      setError("Recording is already in progress.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      audioChunksRef.current = [];
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(
        `Microphone access denied. Please enable it in your browser settings: ${err}`,
      );
      setIsRecording(false);
    }
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    ) {
      setError("No active recording to stop.");
      return null;
    }
    setError(null);
    return new Promise((resolve, reject) => {
      mediaRecorderRef.current!.addEventListener(
        "stop",
        async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorderRef.current!.mimeType,
            });
            audioChunksRef.current = [];
            mediaRecorderRef
              .current!.stream.getTracks()
              .forEach((track) => track.stop());
            mediaRecorderRef.current = null;
            // Process and send to backend
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const pcmData = audioBuffer.getChannelData(0); // Use first channel (mono)
            const audioSamples = Array.from(pcmData);
            const transcription = await invoke<string>("transcribe", {
              audio: audioSamples,
            });
            setIsRecording(false);
            resolve(transcription);
          } catch (err) {
            setError("Failed to transcribe audio: " + err);
            setIsRecording(false);
            reject(err);
          }
        },
        { once: true },
      );
      mediaRecorderRef.current!.stop();
    });
  }, []);

  return { isRecording, error, startRecording, stopAndTranscribe };
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

interface VoiceRecorderState {
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  error: string | null;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<string | null>;
}

export const useVoiceRecorderStore = create<VoiceRecorderState>((set) => ({
  isRecording: false,
  setIsRecording: (value: boolean) => set({ isRecording: value }),
  error: null,

  startRecording: async () => {
    if (mediaRecorder?.state === "recording") {
      set({ error: "Recording is already in progress." });
      return;
    }
    set({ error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      audioChunks = []; // Reset chunks for a new recording
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });
      mediaRecorder.start();
      set({ isRecording: true });
    } catch (err) {
      set({
        error: `Microphone access denied. Please enable it in your browser settings: ${err}`,
        isRecording: false,
      });
    }
  },

  stopAndTranscribe: async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      set({ error: "No active recording to stop." });
      return null;
    }
    set({ error: null });

    return new Promise((resolve, reject) => {
      mediaRecorder!.addEventListener(
        "stop",
        async () => {
          try {
            const audioBlob = new Blob(audioChunks, {
              type: mediaRecorder!.mimeType,
            });
            audioChunks = []; // Clear chunks after processing
            mediaRecorder!.stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
            mediaRecorder = null; // Clear mediaRecorder reference

            // Process and send to backend
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const pcmData = audioBuffer.getChannelData(0); // Use first channel (mono)
            const audioSamples = Array.from(pcmData);

            const transcription = await invoke<string>("transcribe", {
              audio: audioSamples,
            });
            set({ isRecording: false });
            resolve(transcription);
          } catch (err) {
            set({
              error: "Failed to transcribe audio: " + err,
              isRecording: false,
            });
            reject(err);
          }
        },
        { once: true },
      );
      mediaRecorder!.stop();
    });
  },
}));
