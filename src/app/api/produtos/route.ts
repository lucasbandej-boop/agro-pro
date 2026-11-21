import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = () => neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const db = sql();
    const rows = q
      ? await db`select * from produtos where produto ilike ${'%' + q + '%'} order by id desc limit 100`
      : await db`select * from produtos order by id desc limit 100`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ erro: 'Erro' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.produto || !b.preco || !b.telefone) {
      return NextResponse.json({ erro: 'Faltam campos' }, { status: 400 });
    }
    const db = sql();
    await db`insert into produtos (produto, preco, quantidade, provincia, nome, telefone)
      values (${String(b.produto).slice(0, 80)}, ${String(b.preco).slice(0, 40)},
      ${String(b.quantidade || '').slice(0, 40)}, ${String(b.provincia || '').slice(0, 40)},
      ${String(b.nome || '').slice(0, 60)}, ${String(b.telefone).slice(0, 20)})`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: 'Erro' }, { status: 500 });
  }
}
