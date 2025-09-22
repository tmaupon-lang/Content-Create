import { GoogleGenAI, Type } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const singleSocialPostSchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            description: "পোস্টের ধরণ।",
        },
        text: {
            type: Type.STRING,
            description: "সম্পূর্ণ পোস্ট কনটেন্টটি বাংলায় লিখতে হবে, সাথে প্রাসঙ্গিক এবং ট্রেন্ডিং হ্যাশট্যাগ থাকবে। ভাষা হবে আকর্ষণীয় এবং সৃজনশীল।",
        },
        image_prompt: {
            type: Type.STRING,
            description: "এই পোস্টের জন্য ইংরেজিতে একটি বিস্তারিত এবং সৃজনশীল প্রম্পট তৈরি করতে হবে। প্রম্পটটি বাংলাদেশী সংস্কৃতি এবং নান্দনিকতার সাথে মিল রেখে তৈরি করতে হবে। **গুরুত্বপূর্ণ নির্দেশ:** যদি পোস্টটি 'মজার / ভাইরাল মিম' টাইপের হয়, তাহলে প্রম্পটটি অবশ্যই একটি অতি সাধারণ, পরিবার-বান্ধব (family-friendly) এবং সহজে বোঝা যায় এমন কার্টুন বা ইলাস্ট্রেশন হতে হবে। উদাহরণ: 'A cute, simple 2D vector cartoon of a smiling tea cup, with a speech bubble in clean Bengali font saying 'আজকের অফারটা গরম চায়ের মতোই সেরা!'. Focus on simple characters and universally funny situations to avoid safety filters.' ছবির মধ্যে যদি কোনো বাংলা লেখা থাকে, তা যেন শতভাগ নির্ভুল বানানে থাকে।",
        },
    },
    required: ["type", "text", "image_prompt"],
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
                    stage: { type: Type.STRING, description: "The name of the funnel stage in Bengali and English, e.g., 'ধাপ ১: সচেতনতা (Top of Funnel)'." },
                    headline: { type: Type.STRING, description: "A compelling, attention-grabbing headline for this stage's content, in Bengali." },
                    content: { type: Type.STRING, description: "The main body of the content for this stage, written in engaging Bengali." },
                    call_to_action: { type: Type.STRING, description: "The specific call-to-action for this stage, in Bengali." },
                    visual_idea: { type: Type.STRING, description: "A brief description of a suitable visual (image or video) for this content, in English." }
                },
                required: ["stage", "headline", "content", "call_to_action", "visual_idea"]
            }
        }
    },
    required: ["funnel"]
};


const createErrorResponse = (statusCode: number, message: string) => {
    console.error(`Error: ${message}`);
    return {
        statusCode,
        body: JSON.stringify({ error: message }),
    };
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return createErrorResponse(500, 'পরিষেবাটি ব্যবহারের জন্য একটি API Key প্রয়োজন যা সার্ভারে সঠিকভাবে সেট করা নেই।');
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const body = JSON.parse(event.body || '{}');
        const { task, productName, prompt, postType, aspectRatio } = body;

        let result;

        switch (task) {
            case 'generateSingleSocialPost':
                if (!productName || !postType) {
                    return createErrorResponse(400, 'productName এবং postType প্রয়োজন।');
                }

                const getPromptForType = (type: string, product: string) => {
                    const baseInstruction = `আপনি একজন বিশ্বসেরা ডিজিটাল মার্কেটার এবং ভাইরাল কনটেন্ট ক্রিয়েটর, যিনি বিশেষভাবে বাংলাদেশী ই-কমার্স বাজারের জন্য কাজ করেন। আপনার লক্ষ্য হলো '${product}' পণ্যটির জন্য একটি অসাধারণ সোশ্যাল মিডিয়া পোস্ট তৈরি করা। পোস্টটি এমন হতে হবে যা মানুষের স্ক্রলিং থামিয়ে দেয়, তাদের মনে দাগ কাটে এবং শেয়ার করতে বাধ্য করে।`;
                    
                    let typeInstruction = '';
                    switch (type) {
                        case 'তথ্যমূলক ও আবেগঘন':
                            typeInstruction = "আপনাকে একটি 'তথ্যমূলক ও আবেগঘন' পোস্ট তৈরি করতে হবে। পণ্যটির একটি অজানা উপকারিতা বা ফিচারকে কেন্দ্র করে একটি ছোট গল্প বলুন যা মানুষের আবেগকে স্পর্শ করে।";
                            break;
                        case 'মজার / ভাইরাল মিম':
                            typeInstruction = "আপনাকে একটি 'মজার / ভাইরাল মিম' পোস্ট তৈরি করতে হবে। কনসেপ্টটি অবশ্যই বাংলাদেশী দর্শকদের জন্য খুবই প্রাসঙ্গিক, হাসির এবং শেয়ার করার মতো হতে হবে। দৈনন্দিন জীবনের মজার ঘটনা, কথার খেলা বা স্থানীয় পপ কালচার ব্যবহার করুন। হিউমার হতে হবে সহজ এবং নির্মল।";
                            break;
                        case 'আর্জেন্ট সেল পোস্ট':
                            typeInstruction = "আপনাকে একটি 'আর্জেন্ট সেল পোস্ট' তৈরি করতে হবে। একটি শক্তিশালী FOMO (Fear Of Missing Out) অনুভূতি তৈরি করুন। সীমিত সময়ের অফার বা স্টক সীমিত বলে তাৎক্ষণিক ক্রয়ের জন্য উৎসাহিত করুন।";
                            break;
                        case 'কথোপকথন শুরু করার মতো প্রশ্ন':
                            typeInstruction = "আপনাকে একটি 'কথোপকথন শুরু করার মতো প্রশ্ন' পোস্ট তৈরি করতে হবে। পণ্যটি সম্পর্কিত এমন একটি প্রশ্ন করুন যা মানুষকে কমেন্ট করতে এবং তাদের মতামত জানাতে উৎসাহিত করে।";
                            break;
                        default:
                            typeInstruction = `'${product}' পণ্যটির জন্য একটি আকর্ষণীয় পোস্ট তৈরি করুন।`;
                    }

                    return `${baseInstruction}\n\nআপনার কাজ হলো এই ধরণের পোস্ট তৈরি করা: ${typeInstruction}\n\nনির্দেশনা:\n- পোস্টের শেষে অবশ্যই ৩-৪টি প্রাসঙ্গিক ও জনপ্রিয় বাংলা হ্যাশট্যাগ (#tag) যোগ করুন।\n- '${type}' কথাটি পোস্টের আউটপুটে টাইপ হিসেবে দিন।\n- আপনার সম্পূর্ণ আউটপুুটটি অবশ্যই একটি JSON অবজেক্ট ফরম্যাটে হতে হবে যা প্রদত্ত স্কিমা মেনে চলে।`;
                };
                
                const singlePostPrompt = getPromptForType(postType, productName);

                const postResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: singlePostPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: singleSocialPostSchema,
                        temperature: 0.8,
                    },
                });
                result = JSON.parse(postResponse.text.trim());
                break;

            case 'generateContentFunnel':
                const funnelPrompt = `
                    আপনি একজন বিশেষজ্ঞ মার্কেটিং স্ট্র্যাটেজিস্ট, যিনি বাংলাদেশী ই-কমার্স বাজারের জন্য উচ্চ-রূপান্তরকারী (high-converting) সেলস ফানেল তৈরিতে পারদর্শী।
                    আপনার কাজ হলো '${productName}' পণ্যটির জন্য একটি সম্পূর্ণ ৩-ধাপের কনটেন্ট ফানেল তৈরি করা। এই ফানেলটি এমনভাবে ডিজাইন করতে হবে যা বাংলাদেশী গ্রাহকদের আকর্ষণ করে, তাদের বিশ্বাস অর্জন করে এবং অবশেষে তাদের ক্রেতা হিসেবে রূপান্তরিত করে।

                    আপনাকে ৩টি ধাপের জন্য কনটেন্ট তৈরি করতে হবে: টপ অফ ফানেল (সচেতনতা), মিডল অফ ফানেল (বিবেচনা), এবং বটম অফ ফানেল (রূপান্তর)।
                    
                    নির্দেশনা:
                    - প্রতিটি ধাপের জন্য একটি আকর্ষণীয় শিরোনাম, মূল কনটেন্ট, একটি সুস্পষ্ট 'কল টু অ্যাকশন', এবং একটি ভিজ্যুয়াল আইডিয়া (ইংরেজিতে) প্রদান করুন।
                    - সমস্ত লেখা অবশ্যই সাবলীল বাংলায় এবং বাংলাদেশের সংস্কৃতি ও প্রেক্ষাপটের সাথে প্রাসঙ্গিক হতে হবে।
                    - আপনার সম্পূর্ণ আউটপুুটটি অবশ্যই একটি JSON অবজেক্ট ফরম্যাটে হতে হবে যা প্রদত্ত স্কিমা মেনে চলে।
                `;
                const funnelResponse = await ai.models.generateContent({
                     model: "gemini-2.5-flash",
                     contents: funnelPrompt,
                     config: {
                         responseMimeType: "application/json",
                         responseSchema: contentFunnelSchema,
                         temperature: 0.7,
                     },
                });
                const funnelResult = JSON.parse(funnelResponse.text.trim());
                if (!funnelResult.funnel || funnelResult.funnel.length < 3) {
                    throw new Error("ফানেল তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।");
                }
                result = funnelResult.funnel;
                break;

            case 'generatePostImage':
                let fullPrompt: string;
                const culturalContext = "The image must be culturally relevant to Bangladesh, incorporating aesthetics, colors (like festive reds, greens, yellows), and styles common in Bangladeshi advertisements. It should appeal to a modern Bangladeshi audience.";
                const safetyInstructions = "The image must be family-friendly, containing no nudity, violence, offensive symbols, or controversial content.";

                if (postType.includes('মিম') || postType.includes('মজার')) {
                    fullPrompt = `${prompt}. Style: 2D vector cartoon, flat design, simple characters, clean lines, bright and vibrant colors, trending on social media, minimalist. ${culturalContext} ${safetyInstructions}`;
                } else {
                    fullPrompt = `${prompt}. Style: professional product photography, photorealistic, cinematic lighting, high detail, clean background, visually appealing composition. ${culturalContext} ${safetyInstructions}`;
                }
                
                const imageResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: fullPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: aspectRatio,
                    },
                });

                if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                    result = imageResponse.generatedImages[0].image.imageBytes;
                } else {
                    console.warn("Image generation returned no images, likely due to safety filters. Full Prompt:", fullPrompt);
                    result = null;
                }
                break;
            
            default:
                return createErrorResponse(400, 'Invalid task specified.');
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result }),
        };

    } catch (error) {
        let message = 'একটি অজানা সমস্যা হয়েছে।';
        if (error instanceof Error) {
           message = error.message;
           if (error.message.includes('API key not valid') || error.message.includes('400')) {
               message = 'সার্ভারে কনফিগার করা API Key সঠিক নয়। অনুগ্রহ করে সার্ভার কনফিগারেশন পরীক্ষা করুন।';
           } else if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
               message = 'API ব্যবহারের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
           } else if (error.message.includes('500') || error.message.includes('503') || error.message.includes('504')) {
               message = 'সার্ভারে একটি অভ্যন্তরীণ সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
           }
        }
        return createErrorResponse(500, message);
    }
};

export { handler };