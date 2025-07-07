use groq_api_rust::{AsyncGroqClient, SpeechToTextRequest};
use hound::SampleFormat;
use std::env;
use std::io::Cursor;
use tokio::sync::OnceCell;

static GROQ_CLIENT: OnceCell<AsyncGroqClient> = OnceCell::const_new();
async fn get_client() -> &'static AsyncGroqClient {
    GROQ_CLIENT
        .get_or_init(|| async {
            let api_key = env::var("GROQ_API_KEY").expect("GROQ_API_KEY env variable not set");
            AsyncGroqClient::new(api_key.to_string(), None).await
        })
        .await
}

#[tauri::command]
pub fn process_audio(audio: Vec<f32>) -> Result<Vec<u8>, String> {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 16000,
        bits_per_sample: 16,
        sample_format: SampleFormat::Int,
    };

    let mut buffer = Cursor::new(Vec::new());
    {
        let mut writer = hound::WavWriter::new(&mut buffer, spec).map_err(|e| e.to_string())?;

        for &sample in &audio {
            let sample_i16 = (sample * 32767.0) as i16;
            writer.write_sample(sample_i16).map_err(|e| e.to_string())?;
        }
        writer.finalize().map_err(|e| e.to_string())?;
    }

    Ok(buffer.into_inner())
}

#[tauri::command]
pub async fn transcribe(audio: Vec<f32>) -> Result<String, String> {
    // No need for a separate runtime or block_on

    println!("Processing audio..."); // Log progress
                                     // Process the audio to create WAV data in memory
    let wav_data = process_audio(audio)?;
    println!("Audio processed, WAV size: {} bytes", wav_data.len()); // Log size

    // Create the speech-to-text request
    let request = SpeechToTextRequest::new(wav_data)
        .temperature(0.7) // Optional: configure as needed
        .language("en") // Optional: configure as needed
        .model("whisper-large-v3"); // Ensure this model is supported by Groq STT

    println!("Getting Groq client..."); // Log progress
                                        // Get the shared Groq client instance
    let client = get_client().await;

    println!("Sending request to Groq API..."); // Log progress
                                                // Execute the SYNCHRONOUS API request
                                                // This will block the current Tauri command thread, which is acceptable.
    let result = client.speech_to_text(request).await;

    // Handle the Result
    match result {
        Ok(response) => {
            println!("Groq API Success. Transcription: {}", response.text); // Log success and result
            Ok(response.text)
        }
        Err(e) => {
            eprintln!("Groq API Error: {:?}", e); // Log the full error
                                                  // Try to provide a more specific error message if possible
                                                  // For example, if e has a method to get status code or message:
                                                  // Err(format!("Failed to get response from Groq: {} - {}", e.status(), e.message()))
            Err(format!("Failed to get response from Groq: {}", e))
        }
    }
}
