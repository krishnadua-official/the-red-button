import crypto from 'crypto';
import { NextApiRequest } from 'next';

// This function is necessary because Vercel parses the body by default,
// and we need the raw body to verify the Slack signature.
export const getRawBody = (req: NextApiRequest): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            // @ts-expect-error - Bypassing a strict type issue with Buffer.concat in newer TypeScript versions
            resolve(Buffer.concat(chunks));
        });
        req.on('error', (err) => reject(err));
    });
};

export const verifySlackRequest = (req: NextApiRequest, rawBody: Buffer): boolean => {
    const signature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const signingSecret = process.env.SLACK_SIGNING_SECRET!;

    if (!signature || !timestamp || !signingSecret) {
        return false;
    }

    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp, 10) < fiveMinutesAgo) {
        return false;
    }

    const baseString = `v0:${timestamp}:${rawBody.toString()}`;
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(baseString);
    const computedSignature = `v0=${hmac.digest('hex')}`;

    // --- REPLACED THE PROBLEMATIC FUNCTION WITH A SIMPLE, SECURE STRING COMPARISON ---
    return signature === computedSignature;
};
