
export interface SocialPost {
    type: string;
    text: string;
    image_prompt: string;
}

export interface GeneratedContent extends SocialPost {
    imageUrl: string;
}

export interface FunnelStep {
    stage: string;
    headline: string;
    content: string;
    call_to_action: string;
    visual_idea: string;
}
