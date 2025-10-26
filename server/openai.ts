/**
 * OpenAI客户端配置
 * 使用Replit AI Integrations服务，无需自己的OpenAI API密钥
 * 参考: blueprint:javascript_openai_ai_integrations
 */
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// 这使用了Replit的AI Integrations服务，提供OpenAI兼容的API访问，无需你自己的OpenAI API密钥
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

/**
 * 生成宠物图片
 * 使用gpt-image-1模型生成可爱的学习宠物图片
 * @param petName - 宠物名称
 * @param petDescription - 宠物描述
 * @returns Base64编码的图片数据
 */
export async function generatePetImage(
  petName: string,
  petDescription: string
): Promise<string> {
  try {
    // 构建详细的提示词，确保生成适合中学生的可爱宠物图片
    const prompt = `Create a cute, friendly cartoon pet character for a middle school learning app. 
Pet name: ${petName}
Pet description: ${petDescription}
Style: Adorable, colorful, anime-inspired, suitable for children aged 12-16. 
The pet should look happy, friendly and encourage learning. Simple, clean design with bright colors.`;

    // 使用gpt-image-1模型生成图片
    // 注意：response_format参数不支持，响应格式始终为base64
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "512x512",
    });

    // 提取base64图片数据
    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }
    
    const imageData = response.data[0].b64_json;
    if (!imageData) {
      throw new Error("No image data returned from OpenAI");
    }

    return imageData;
  } catch (error) {
    console.error("Error generating pet image:", error);
    throw new Error("Failed to generate pet image");
  }
}

/**
 * 为宠物生成个性化的成长建议
 * 使用gpt-5模型根据学生的学习表现生成建议
 * @param petLevel - 宠物等级
 * @param experience - 宠物经验值
 * @param studentName - 学生姓名
 * @returns 个性化建议文本
 */
export async function generatePetAdvice(
  petLevel: number,
  experience: number,
  studentName: string
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "你是一个友善的虚拟宠物，你的任务是鼓励中学生完成学习任务。请用温暖、积极的语气，给出简短的鼓励或建议（不超过50字）。"
        },
        {
          role: "user",
          content: `我的小主人${studentName}让我达到了${petLevel}级，经验值${experience}。请给我的小主人一些鼓励的话。`
        }
      ],
      max_completion_tokens: 150,
    });

    const advice = response.choices[0]?.message?.content;
    if (!advice) {
      throw new Error("No advice returned from OpenAI");
    }

    return advice.trim();
  } catch (error) {
    console.error("Error generating pet advice:", error);
    throw new Error("Failed to generate pet advice");
  }
}
