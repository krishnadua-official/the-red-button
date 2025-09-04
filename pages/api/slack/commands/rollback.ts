// pages/api/slack/commands/rollback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getRawBody, verifySlackRequest } from '../../../../lib/slack';

// Disable Vercel's default body parser to access the raw body for signature verification
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const rawBody = await getRawBody(req);
    if (!verifySlackRequest(req, rawBody)) {
        return res.status(401).send('Verification failed');
    }
    
    const body = JSON.parse(rawBody.toString());
    const { text: projectName, user_id, channel_id } = body;
    
    try {
        const vercelApiUrl = `https://api.vercel.com/v6/deployments?projectId=${projectName}&target=production&state=READY&limit=2`;
        const vercelRes = await fetch(vercelApiUrl, {
            headers: { 'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}` }
        });

        if (!vercelRes.ok) throw new Error('Failed to fetch deployments from Vercel.');

        const data = await vercelRes.json();
        const lastGoodDeployment = data.deployments[1];
        
        if (!lastGoodDeployment) throw new Error('No previous successful deployment found to roll back to.');
        
        const rollbackDeploymentId = lastGoodDeployment.uid;
        
        const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000';
        const confirmationUrl = `${VERCEL_URL}/confirm?projectId=${projectName}&rollbackId=${rollbackDeploymentId}&userId=${user_id}&channelId=${channel_id}`;
        
        const blockKitMessage = {
            response_type: 'ephemeral',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `You are about to roll back the production deployment for *${projectName}*.\n\nThis is a critical action. Please confirm.`
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: '🔴 Confirm Production Rollback',
                                emoji: true
                            },
                            style: 'danger',
                            url: confirmationUrl,
                            action_id: 'confirm_rollback_button'
                        }
                    ]
                }
            ]
        };
        return res.status(200).json(blockKitMessage);

    } catch (error: any) {
        console.error(error);
        return res.status(200).json({ text: `An error occurred: ${error.message}` });
    }
}
