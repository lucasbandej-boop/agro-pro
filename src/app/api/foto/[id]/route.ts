import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await neon(process.env.DATABASE_URL!)`select foto from produtos where id = ${Number(id)}`;
  const foto = rows[0]?.foto as string | undefined;
  if (!foto) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(Buffer.from(foto, 'base64')), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
