import { GoogleGenAI } from "@google/genai";

interface GenerationResult {
  text: string;
  imageUrl: string;
}

export const generatePostAndImage = async (
  prompt: string,
  timeSlot: string,
  apiKey: string
): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey });

  // Generate Text
  const textPrompt = `Create a short, engaging, and professional social media post in the Bengali language based on the following topic: '${prompt}'. The tone should be positive and appealing to a general audience. The post must be only in Bengali. Do not add any English text. At the end, on new lines, add 3-5 relevant and trending Bengali hashtags suitable for a ${timeSlot} post. Just return the post content with the hashtags.`;
  
  const textResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: textPrompt,
  });
  
  const generatedText = textResponse.text.trim();

  // Generate Image
  const imagePrompt = `A vibrant and professional social media graphic for a post about: '${prompt}'. The image should be visually appealing, high quality, and suitable for platforms like Instagram or Facebook. Cinematic, photorealistic. If any text is included in the image, it must be in clear, legible Bengali with perfect spelling.`;
  
  const imageResponse = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: imagePrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
    throw new Error("Image generation failed.");
  }

  const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
  const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
  
  return { text: generatedText, imageUrl };
};
