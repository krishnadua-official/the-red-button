// pages/api/actions/execute-rollback.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { projectName, rollbackDeploymentId, userId, channelId } = req.body;
    
    try {
        await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`
            },
            body: JSON.stringify({
                name: projectName,
                deploymentId: rollbackDeploymentId,
                target: 'production'
            })
        });

        await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
                channel: channelId,
                text: `🔴 Rollback for *${projectName}* initiated by <@${userId}>.`
            })
        });

        res.status(200).send('Rollback initiated.');

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
