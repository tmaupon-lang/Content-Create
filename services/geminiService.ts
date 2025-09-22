import type { SocialPost, FunnelStep } from '../types';

const API_ENDPOINT = '/.netlify/functions/generate';

async function callApi<T>(body: object): Promise<T> {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = `সার্ভার থেকে একটি ত্রুটি এসেছে (${response.status} ${response.statusText})।`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                console.error("Could not parse error response as JSON.", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.result;

    } catch (error) {
         if (error instanceof Error) {
            console.error("API Call Error:", error.message);
            throw error;
         }
         throw new Error("একটি অজানা সমস্যা হয়েছে।");
    }
}

export const generateSingleSocialPost = async (productName: string, postType: string): Promise<SocialPost> => {
    return callApi<SocialPost>({ 
        task: 'generateSingleSocialPost', 
        productName,
        postType
    });
};

export const generateContentFunnel = async (productName: string): Promise<FunnelStep[]> => {
    return callApi<FunnelStep[]>({ 
        task: 'generateContentFunnel', 
        productName 
    });
};

export const generatePostImage = async (prompt: string, postType: string, aspectRatio: '1:1' | '16:9' | '9:16'): Promise<string | null> => {
    return callApi<string | null>({
        task: 'generatePostImage',
        prompt,
        postType,
        aspectRatio
    });
};
