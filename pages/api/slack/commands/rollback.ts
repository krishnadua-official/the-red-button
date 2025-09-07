// pages/api/slack/commands/rollback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getRawBody, verifySlackRequest } from '../../../../lib/slack';

export const config = { api: { bodyParser: false } };

// Define a type for the expected Slack command body
interface SlackCommandBody {
    text: string;
    user_id: string;
    channel_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const rawBody = await getRawBody(req);
        if (!verifySlackRequest(req, rawBody)) {
            return res.status(401).json({ error: 'Verification failed' });
        }

        const body: SlackCommandBody = JSON.parse(rawBody.toString());
        const { text: projectName } = body;

        if (!projectName) {
             return res.status(200).json({ text: 'Error: Please provide a project name. Usage: /rollback <project-name>' });
        }

        // For now, we just return a success message. We will add the button logic in the next phase.
        const responseMessage = {
            response_type: 'ephemeral', // Only visible to the user
            text: `✅ Command received! Preparing rollback for project: *${projectName}*...`
        };

        return res.status(200).json(responseMessage);

    } catch (error) {
        console.error(error);
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: errorMessage });
    }
}
