import { NextResponse } from 'next/server';
import ip from 'ip';

export async function GET() {
  return NextResponse.json({ ip: ip.address() });
}
