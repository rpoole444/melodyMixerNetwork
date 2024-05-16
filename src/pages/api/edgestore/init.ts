// src/pages/api/edgestore/init.ts
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // console.log('Initializing EdgeStore: ', edgeStore);
      res.status(200).json({ message: 'Initialization successful' });
    } catch (error) {
      console.error('Error initializing Edge Store:', error);
      res.status(500).json({ message: 'Initialization failed', error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
