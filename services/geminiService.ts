import { GoogleGenAI, Type } from "@google/genai";
import type { SocialPost, FunnelStep } from '../types';

const socialPostSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: {
                type: Type.STRING,
                description: "পোস্টের ধরণ (যেমন: তথ্যমূলক, মজার পোস্ট, সেল পোস্ট, প্রশ্ন)।",
            },
            text: {
                type: Type.STRING,
                description: "সম্পূর্ণ পোস্ট কনটেন্টটি বাংলায় লিখতে হবে, সাথে প্রাসঙ্গিক এবং ট্রেন্ডিং হ্যাশট্যাগ থাকবে। ভাষা হবে আকর্ষণীয় এবং সৃজনশীল।",
            },
            image_prompt: {
                type: Type.STRING,
                description: "এই পোস্টের জন্য ইংরেজিতে একটি বিস্তারিত এবং সৃজনশীল প্রম্পট তৈরি করতে হবে। প্রম্পটটি বাংলাদেশী সংস্কৃতি এবং নান্দনিকতার সাথে মিল রেখে তৈরি করতে হবে। **গুরুত্বপূর্ণ নির্দেশ:** যদি পোস্টে বাংলা লেখা (যেমন: মিমের ক্যাপশন বা স্পিচ বাবল) থাকে, তাহলে সেই লেখাটি ছবিতে **অবশ্যই শতভাগ নির্ভুল বানানে এবং সুস্পষ্টভাবে** দেখাতে হবে। এটি সবচেয়ে জরুরি। ভাঙা বা ভুল অক্ষরের জন্য কোনো ছাড় দেওয়া হবে না। ছবির প্রম্পটটি এইভাবে তৈরি করুন: প্রথমে ছবির বর্ণনা দিন, তারপর বাংলা লেখা যোগ করার জন্য একটি সুনির্দিষ্ট কাঠামো অনুসরণ করুন। উদাহরণ: 'A simple, funny cartoon illustration of a cat looking surprised. A large, clear speech bubble above its head contains the Bengali text. **CRITICAL INSTRUCTION FOR TEXT:** The following Bengali text must be rendered inside the bubble with **100% perfect spelling, grammar, and legibility. No broken characters allowed.** The text is: 'এইমাত্র অফারটা দেখলাম!'. The visual style should be family-friendly and suitable for a general audience.' এই কাঠামোটি কঠোরভাবে অনুসরণ করতে হবে এবং মিমগুলো যেন সাধারণ ও হাসির হয়, কোনো বিতর্কিত বিষয় থাকবে না।",
            },
        },
        required: ["type", "text", "image_prompt"],
    },
};

const contentFunnelSchema = {
    type: Type.OBJECT,
    properties: {
        funnel: {
            type: Type.ARRAY,
            description: "A 3-step content funnel.",
            items: {
                type: Type.OBJECT,
                properties: {
                    stage: {
                        type: Type.STRING,
                        description: "The name of the funnel stage in Bengali and English, e.g., 'ধাপ ১: সচেতনতা (Top of Funnel)'."
                    },
                    headline: {
                        type: Type.STRING,
                        description: "A compelling, attention-grabbing headline for this stage's content, in Bengali."
                    },
                    content: {
                        type: Type.STRING,
                        description: "The main body of the content for this stage, written in engaging Bengali."
                    },
                    call_to_action: {
                        type: Type.STRING,
                        description: "The specific call-to-action for this stage, in Bengali."
                    },
                    visual_idea: {
                        type: Type.STRING,
                        description: "A brief description of a suitable visual (image or video) for this content, in English."
                    }
                },
                required: ["stage", "headline", "content", "call_to_action", "visual_idea"]
            }
        }
    },
    required: ["funnel"]
};


const handleApiError = (error: unknown, defaultMessage: string): Error => {
    console.error("API Error:", error);
    let message = defaultMessage;
    if (error instanceof Error && error.message) {
        // Check for common API error patterns in the message string
        if (error.message.includes('API key not valid') || error.message.includes('400')) {
            message = 'আপনার দেওয়া API Key সঠিক নয়। অনুগ্রহ করে পরীক্ষা করে আবার দিন।';
        } else if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            message = 'API ব্যবহারের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
        } else if (error.message.includes('500')) {
            message = 'সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
        }
    }
    return new Error(message);
}


export const generateSocialPosts = async (productName: string, apiKey: string): Promise<SocialPost[]> => {
    if (!apiKey) {
        throw new Error("API Key is required.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const prompt = `
            আপনি একজন বিশ্বসেরা ডিজিটাল মার্কেটার এবং ভাইরাল কনটেন্ট ক্রিয়েটর, যিনি বিশেষভাবে বাংলাদেশী ই-কমার্স বাজারের জন্য কাজ করেন। আপনার লক্ষ্য হলো '${productName}' পণ্যটির জন্য ৪টি অসাধারণ সোশ্যাল মিডিয়া পোস্ট তৈরি করা। প্রতিটি পোস্ট এমন হতে হবে যা মানুষের স্ক্রলিং থামিয়ে দেয়, তাদের মনে দাগ কাটে এবং শেয়ার করতে বাধ্য করে।

            আপনার প্রধান কৌশলগুলো হলো:
            - **গভীর মানসিক সংযোগ:** প্রতিটি লেখায় এমনভাবে গল্প বলুন যা বাংলাদেশের মানুষের সংস্কৃতি, আবেগ এবং দৈনন্দিন জীবনের সাথে মিলে যায়।
            - **ভাইরাল হওয়ার সম্ভাবনা:** বুদ্ধিদীপ্ত এবং মজাদার শব্দচয়ন (clever wordplay), ট্রেন্ডিং রেফারেন্স এবং হিউমার ব্যবহার করুন।
            - **অত্যাশ্চর্য ভিজ্যুয়াল:** প্রতিটি পোস্টের সাথে একটি নিখুঁতভাবে মানানসই ছবির ধারণা দিন।

            আপনাকে নিম্নলিখিত ৪ ধরণের পোস্ট তৈরি করতে হবে (প্রতিটি সর্বোচ্চ মানের):
            ১. **তথ্যমূলক ও আবেগঘন (Informational & Emotional):** পণ্যটির একটি অজানা উপকারিতা বা ফিচারকে কেন্দ্র করে একটি ছোট গল্প বলুন। গল্পটি যেন গ্রাহকের কোনো সমস্যার বাস্তব সমাধান দেয়।
            ২. **মজার / ভাইরাল মিম (Funny / Viral Meme):** '${productName}' পণ্যটি ব্যবহার করে একটি অত্যন্ত প্রাসঙ্গিক, হাসির এবং শেয়ার করার মতো মিম তৈরি করুন। মিমটি যেন একদম খাঁটি বাংলাদেশী মনে হয়।
            ৩. **আর্জেন্ট সেল পোস্ট (Urgent Sales Post):** শুধু ছাড়ের ঘোষণা নয়, বরং 'এখনই না কিনলেพลาด হয়ে যাবে' (FOMO - Fear Of Missing Out) এমন একটি অনুভূতি তৈরি করুন। সীমিত স্টক বা সীমিত সময়ের অফার দিয়ে আকর্ষণীয়ভাবে উপস্থাপন করুন।
            ৪. **কথোপকথন শুরু করার মতো প্রশ্ন (Conversation Starter Question):** পণ্যটির সাথে সম্পর্কিত এমন একটি প্রশ্ন করুন যা মানুষকে কমেন্ট করতে উৎসাহিত করে। প্রশ্নটি তাদের স্মৃতি, অভিজ্ঞতা বা স্বপ্নের সাথে সম্পর্কিত হতে পারে।

            নির্দেশনা:
            - প্রতিটি পোস্টের শেষে অবশ্যই ৩-৪টি প্রাসঙ্গিক ও জনপ্রিয় বাংলা হ্যাশট্যাগ (#tag) যোগ করুন।
            - আপনার সম্পূর্ণ আউটপুুটটি অবশ্যই একটি JSON অ্যারে ফরম্যাটে হতে হবে।
            - প্রতিটি পোস্টের জন্য ইংরেজিতে একটি অত্যন্ত বিস্তারিত 'image_prompt' তৈরি করতে হবে।
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: socialPostSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        const posts: SocialPost[] = JSON.parse(jsonText);
        return posts;
    } catch (error) {
        throw handleApiError(error, "সোশ্যাল মিডিয়া পোস্ট তৈরি করা যায় নি।");
    }
};

export const generateContentFunnel = async (productName: string, apiKey: string): Promise<FunnelStep[]> => {
    if (!apiKey) {
        throw new Error("API Key is required.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const prompt = `
            আপনি একজন বিশেষজ্ঞ মার্কেটিং স্ট্র্যাটেজিস্ট, যিনি বাংলাদেশী ই-কমার্স বাজারের জন্য উচ্চ-রূপান্তরকারী (high-converting) সেলস ফানেল তৈরিতে পারদর্শী।
            আপনার কাজ হলো '${productName}' পণ্যটির জন্য একটি সম্পূর্ণ ৩-ধাপের কনটেন্ট ফানেল তৈরি করা। এই ফানেলটি এমনভাবে ডিজাইন করতে হবে যা বাংলাদেশী গ্রাহকদের আকর্ষণ করে, তাদের বিশ্বাস অর্জন করে এবং অবশেষে তাদের ক্রেতা হিসেবে রূপান্তরিত করে।

            আপনাকে নিম্নলিখিত ৩টি ধাপের জন্য কনটেন্ট তৈরি করতে হবে:

            ধাপ ১: টপ অফ ফানেল (TOFU) - সচেতনতা তৈরি:
            - **লক্ষ্য:** এমন গ্রাহকদের আকর্ষণ করা যারা এখনও আপনার পণ্য সম্পর্কে জানে না। এখানে সরাসরি পণ্য বিক্রি করার চেষ্টা করা যাবে না।
            - **কনটেন্ট:** শিক্ষামূলক, मनोरंजक বা তথ্যপূর্ণ হতে হবে। এমন কিছু যা গ্রাহকের কোনো সমস্যার সমাধান দেয় বা তাদের আগ্রহ জাগায়।
            - **উদাহরণ:** একটি ব্লগ পোস্ট, একটি ছোট টিউটোরিয়াল ভিডিও, বা একটি আকর্ষণীয় ইনফোগ্রাফিক।

            ধাপ ২: মিডল অফ ফানেল (MOFU) - বিবেচনা অর্জন:
            - **লক্ষ্য:** সম্ভাব্য গ্রাহকদের মধ্যে বিশ্বাস তৈরি করা এবং '${productName}'-কে তাদের সমস্যার সেরা সমাধান হিসেবে উপস্থাপন করা।
            - **কনটেন্ট:** পণ্যের কার্যকারিতা, উপকারিতা এবং এটি কীভাবে অন্যদের থেকে সেরা তা তুলে ধরতে হবে।
            - **উদাহরণ:** গ্রাহকের প্রশংসাপত্র (testimonial), একটি বিস্তারিত কেস স্টাডি, বা পণ্যের ডেমো ভিডিও।

            ধাপ ৩: বটম অফ ফানেল (BOFU) - রূপান্তর (Conversion):
            - **লক্ষ্য:** সম্ভাব্য গ্রাহকদের চূড়ান্তভাবে পণ্যটি কিনতে উৎসাহিত করা।
            - **কনটেন্ট:** একটি শক্তিশালী 'কল টু অ্যাকশন' (Call to Action) থাকতে হবে।
            - **উদাহরণ:** একটি সীমিত সময়ের জন্য বিশেষ ছাড়ের ঘোষণা, একটি বিশেষ বান্ডেল অফার, বা 'এখনই কিনুন' বোতাম।

            নির্দেশনা:
            - প্রতিটি ধাপের জন্য একটি আকর্ষণীয় শিরোনাম, মূল কনটেন্ট, একটি সুস্পষ্ট 'কল টু অ্যাকশন', এবং একটি ভিজ্যুয়াল আইডিয়া (ইংরেজিতে) প্রদান করুন।
            - সমস্ত লেখা অবশ্যই সাবলীল বাংলায় এবং বাংলাদেশের সংস্কৃতি ও প্রেক্ষাপটের সাথে প্রাসঙ্গিক হতে হবে।
            - আপনার সম্পূর্ণ আউটপুুটটি অবশ্যই একটি JSON অবজেক্ট ফরম্যাটে হতে হবে যা প্রদত্ত স্কিমা মেনে চলে।
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: contentFunnelSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const result: { funnel: FunnelStep[] } = JSON.parse(jsonText);
        
        if (!result.funnel || result.funnel.length < 3) {
             throw new Error("ফানেল তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।");
        }

        return result.funnel;

    } catch (error) {
        throw handleApiError(error, "কনটেন্ট ফানেল তৈরি করা যায় নি।");
    }
};


export const generatePostImage = async (prompt: string, postType: string, apiKey: string, aspectRatio: '1:1' | '16:9' | '9:16'): Promise<string | null> => {
    if (!apiKey) {
        throw new Error("API Key is required.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        let fullPrompt: string;
        const culturalContext = "The image should be culturally relevant to Bangladesh, incorporating aesthetics, colors (like festive reds, greens, yellows), and styles commonly seen in Bangladeshi product advertisements and social media. It should appeal to a modern Bangladeshi audience.";

        if (postType.includes('মিম') || postType.includes('মজার')) {
            // Added guidance for simple, clear, family-friendly memes
            fullPrompt = `${prompt}, simple and funny cartoon or illustration style, clear and legible Bengali text, vibrant colors, trending on Bangladeshi social media, family-friendly meme format. ${culturalContext}`;
        } else {
            // Refined prompt for general posts
            fullPrompt = `${prompt}, photorealistic product photography, cinematic lighting, high detail, styled for a Bangladeshi e-commerce campaign, clean and professional look. ${culturalContext}`;
        }
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            console.warn("Image generation returned no images, likely due to safety filters. Full Prompt:", fullPrompt);
            return null;
        }
    } catch (error) {
       throw handleApiError(error, "ছবি তৈরি করা যায় নি।");
    }
};
