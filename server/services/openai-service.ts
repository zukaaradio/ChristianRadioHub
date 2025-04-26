import OpenAI from "openai";
import { promises as fs } from 'fs';
import path from 'path';
import { log } from '../vite';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Voice options available through OpenAI's API
type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Default voice if none specified
const DEFAULT_VOICE: OpenAIVoice = (process.env.DEFAULT_VOICE as OpenAIVoice) || 'nova';

// Output directory for TTS files
const TTS_OUTPUT_DIR = process.env.TTS_OUTPUT_DIR || './uploads/tts';

// Ensure the TTS output directory exists
async function ensureOutputDirExists() {
  try {
    await fs.mkdir(TTS_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    log(`Error creating TTS output directory: ${error.message}`);
  }
}

/**
 * Generate a radio announcement script 
 * @param prompt The context/instructions for the script
 * @param showDetails Optional details about the show being announced
 * @param scriptType Type of script (intro, outro, verse, etc.)
 * @returns The generated script text
 */
export async function generateScript(
  prompt: string, 
  showDetails?: { title: string; host: string; description: string },
  scriptType: 'intro' | 'outro' | 'verse' | 'announcement' | 'custom' = 'custom'
): Promise<string> {
  try {
    // Create a system prompt based on script type
    let systemPrompt = "You are a professional Christian radio announcer with a warm, inviting voice.";
    
    switch (scriptType) {
      case 'intro':
        systemPrompt += " Create a brief, engaging introduction for a radio show. Keep it concise and inviting.";
        break;
      case 'outro':
        systemPrompt += " Create a brief, warm outro for a radio show. Thank the audience and remind them when the show returns.";
        break;
      case 'verse':
        systemPrompt += " Create a thoughtful, reverent introduction to a Bible verse that will be shared. Keep it brief but spiritually meaningful.";
        break;
      case 'announcement':
        systemPrompt += " Create a clear, engaging announcement for a Christian radio station. Be informative but brief.";
        break;
    }
    
    // Build the user prompt with show details if provided
    let userPrompt = prompt;
    if (showDetails) {
      userPrompt += `\n\nShow Title: ${showDetails.title}\nHost: ${showDetails.host}\nDescription: ${showDetails.description}`;
    }

    // Generate the script using OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content?.trim() || "No script was generated.";
  } catch (error) {
    log(`Error generating script: ${error.message}`);
    return "We are experiencing technical difficulties. Please stand by.";
  }
}

/**
 * Convert text to speech and save as audio file
 * @param text The text to convert to speech
 * @param voice The voice to use (default: 'nova')
 * @param filename Optional custom filename (default: generate based on timestamp)
 * @returns Path to the saved audio file
 */
export async function textToSpeech(
  text: string, 
  voice: OpenAIVoice = DEFAULT_VOICE,
  filename?: string
): Promise<string> {
  try {
    await ensureOutputDirExists();
    
    // Generate a filename if not provided
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      filename = `tts_${timestamp}.mp3`;
    }
    
    // Ensure filename has .mp3 extension
    if (!filename.endsWith('.mp3')) {
      filename += '.mp3';
    }
    
    const outputPath = path.join(TTS_OUTPUT_DIR, filename);
    
    // Generate the audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
    });
    
    // Convert to buffer and save to file
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    log(`Error converting text to speech: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a script and convert it to speech in one step
 * @param prompt The prompt for script generation
 * @param voice The voice to use for TTS
 * @param showDetails Optional show details
 * @param scriptType The type of script
 * @returns Path to the generated audio file
 */
export async function generateVoiceAnnouncement(
  prompt: string,
  voice: OpenAIVoice = DEFAULT_VOICE,
  showDetails?: { title: string; host: string; description: string },
  scriptType: 'intro' | 'outro' | 'verse' | 'announcement' | 'custom' = 'custom'
): Promise<{ audioPath: string; scriptText: string }> {
  // First generate the script
  const scriptText = await generateScript(prompt, showDetails, scriptType);
  
  // Then convert to speech
  const filename = `${scriptType}_${Date.now()}.mp3`;
  const audioPath = await textToSpeech(scriptText, voice, filename);
  
  return { audioPath, scriptText };
}

export default {
  generateScript,
  textToSpeech,
  generateVoiceAnnouncement
};