import { google } from 'googleapis';

const SPREADSHEET_ID = '1Fr4gwXZjeBvOtsOVpqPuzkOSdGC5OcEEBgT8IeMDIRQ';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Debug logs
console.log('Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('Private Key exists:', !!process.env.GOOGLE_PRIVATE_KEY);

const sheets = google.sheets({ version: 'v4', auth });

export interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  projectDetails: string;
  date: string;
}

export async function appendClientData(data: ClientData) {
  try {
    console.log('Attempting to append data:', data);
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data.name,
          data.email,
          data.phone,
          data.address,
          data.projectDetails,
          data.date
        ]],
      },
    });

    console.log('Google Sheets API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function getClientData() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:F', // Adjust range based on your sheet structure
    });

    return response.data.values;
  } catch (error) {
    console.error('Error getting data from Google Sheets:', error);
    throw error;
  }
} 