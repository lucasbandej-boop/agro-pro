import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { lerSessao } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = () => neon(process.env.DATABASE_URL!);
const erro = (m: string, s = 400) => NextResponse.json({ erro: m }, { status: s });

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const q = '%' + (p.get('q') || '').trim() + '%';
    const prov = (p.get('provincia') || '').trim();
    let meu: number | null = null;
    if (p.get('meus') === '1') {
      meu = lerSessao(req);
      if (!meu) return erro('Entre primeiro', 401);
    }
    const rows = await sql()`
      select id, produto, preco, quantidade, provincia, nome, telefone,
             coalesce(vendido, false) as vendido, (foto is not null) as tem_foto
      from produtos
      where produto ilike ${q}
        and (${prov} = '' or provincia = ${prov})
        and (${meu}::bigint is null or agricultor_id = ${meu}::bigint)
      order by coalesce(vendido, false) asc, id desc
      limit 100`;
    return NextResponse.json(rows);
  } catch {
    return erro('Erro', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = lerSessao(req);
    if (!uid) return erro('Entre primeiro', 401);
    const b = await req.json();
    if (!b.produto || !b.preco) return erro('Faltam campos');
    let foto: string | null = null;
    if (b.foto) {
      const f = String(b.foto);
      if (!f.startsWith('data:image/jpeg;base64,') || f.length > 400000) return erro('Foto inválida');
      foto = f.split(',')[1];
    }
    const db = sql();
    const a = await db`select nome, telefone, provincia from agricultores where id = ${uid}`;
    if (!a.length) return erro('Entre primeiro', 401);
    await db`insert into produtos (produto, preco, quantidade, provincia, nome, telefone, foto, agricultor_id)
      values (${String(b.produto).slice(0, 80)}, ${String(b.preco).slice(0, 40)},
      ${String(b.quantidade || '').slice(0, 40)}, ${a[0].provincia}, ${a[0].nome}, ${a[0].telefone},
      ${foto}, ${uid})`;
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const uid = lerSessao(req);
    if (!uid) return erro('Entre primeiro', 401);
    const b = await req.json();
    const r = await sql()`update produtos set vendido = ${!!b.vendido}
      where id = ${Number(b.id)} and agricultor_id = ${uid} returning id`;
    if (!r.length) return erro('Não é seu', 403);
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = lerSessao(req);
    if (!uid) return erro('Entre primeiro', 401);
    const b = await req.json();
    const r = await sql()`delete from produtos
      where id = ${Number(b.id)} and agricultor_id = ${uid} returning id`;
    if (!r.length) return erro('Não é seu', 403);
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}
