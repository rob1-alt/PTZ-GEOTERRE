import type { NextApiRequest, NextApiResponse } from 'next';
import { appendClientData, ClientData } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Route called with method:', req.method);
  
  if (req.method === 'POST') {
    try {
      console.log('Request headers:', req.headers);
      console.log('Request body:', req.body);
      
      if (!req.body) {
        console.log('No body received in request');
        return res.status(400).json({ error: 'No data received' });
      }
      
      const clientData: ClientData = req.body;
      console.log('Parsed client data:', clientData);
      
      // Validate required fields
      if (!clientData.name || !clientData.email) {
        console.log('Missing required fields:', { 
          hasName: !!clientData.name, 
          hasEmail: !!clientData.email 
        });
        return res.status(400).json({ error: 'Name and email are required' });
      }

      console.log('Attempting to append data to Google Sheets...');
      const result = await appendClientData(clientData);
      console.log('Successfully appended data:', result);
      
      res.status(200).json({ message: 'Client data saved successfully', data: result });
    } catch (error) {
      console.error('Error in API route:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ 
        error: 'Failed to save client data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    console.log('Invalid method:', req.method);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 