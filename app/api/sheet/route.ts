import { NextResponse } from 'next/server';
import { google } from 'googleapis';

async function getSheetsClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function POST(request: Request) {
  if (!SHEET_ID) return NextResponse.json({ error: "Google Sheet ID not configured" }, { status: 500 });

  try {
    const body = await request.json();
    const rowData = body.data[0]; 
    
    const sheets = await getSheetsClient();

    // Now pushing 8 columns instead of 7
    const values = [
      [
        rowData.participantId,
        rowData.timestamp,
        rowData.colorName,
        rowData.colorHex,
        rowData.stareDuration,
        rowData.persistenceDuration,
        rowData.perceivedColor,
        rowData.aiInsight
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:H', // Expanded range to H
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cloud sync failed" }, { status: 500 });
  }
}

export async function GET() {
  if (!SHEET_ID) return NextResponse.json([]);
  
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:H', // Expanded range to H
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return NextResponse.json([]);

    const data = rows.slice(1).map((row) => ({
      participantId: row[0] || '',
      timestamp: row[1] || '',
      colorName: row[2] || '',
      colorHex: row[3] || '',
      stareDuration: row[4] || 0,
      persistenceDuration: row[5] || 0,
      perceivedColor: row[6] || '',
      aiInsight: row[7] || '',
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch from sheet" }, { status: 500 });
  }
}