export const config = { runtime: 'nodejs' };

export default function handler(_req: any, res: any) {
  return res.status(200).json({
    message: 'hello from api',
    ts: Date.now(),
    env: {
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY),
      hasDriveFolderId: Boolean(process.env.DRIVE_FOLDER_ID),
      hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      hasGoogleRedirectUri: Boolean(process.env.GOOGLE_REDIRECT_URI),
      hasGoogleRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
      haveGoogleCreds: Boolean(
        process.env.DRIVE_FOLDER_ID &&
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REDIRECT_URI &&
        process.env.GOOGLE_REFRESH_TOKEN
      ),
    },
  });
}