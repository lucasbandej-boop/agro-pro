import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const db = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  let query = db().from('produtos').select('*').order('id', { ascending: false }).limit(100);
  if (q) query = query.ilike('produto', `%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: 'Erro' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.produto || !b.preco || !b.telefone) {
    return NextResponse.json({ erro: 'Faltam campos' }, { status: 400 });
  }
  const { error } = await db().from('produtos').insert({
    produto: String(b.produto).slice(0, 80),
    preco: String(b.preco).slice(0, 40),
    quantidade: String(b.quantidade || '').slice(0, 40),
    provincia: String(b.provincia || '').slice(0, 40),
    nome: String(b.nome || '').slice(0, 60),
    telefone: String(b.telefone).slice(0, 20),
  });
  if (error) return NextResponse.json({ erro: 'Erro' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
