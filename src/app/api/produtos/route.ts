import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const sql = () => neon(process.env.DATABASE_URL!);
const hash = (pin: string) => createHash('sha256').update('agro:' + pin).digest('hex');
const erro = (m: string, s = 400) => NextResponse.json({ erro: m }, { status: s });

export async function GET(req: NextRequest) {
  try {
    const q = '%' + (req.nextUrl.searchParams.get('q') || '').trim() + '%';
    const prov = (req.nextUrl.searchParams.get('provincia') || '').trim();
    const rows = await sql()`
      select id, produto, preco, quantidade, provincia, nome, telefone,
             coalesce(vendido, false) as vendido, (foto is not null) as tem_foto
      from produtos
      where produto ilike ${q} and (${prov} = '' or provincia = ${prov})
      order by coalesce(vendido, false) asc, id desc
      limit 100`;
    return NextResponse.json(rows);
  } catch {
    return erro('Erro', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const pin = String(b.pin || '');
    if (!b.produto || !b.preco || !b.telefone || !/^\d{4}$/.test(pin)) {
      return erro('Faltam campos');
    }
    let foto: string | null = null;
    if (b.foto) {
      const f = String(b.foto);
      if (!f.startsWith('data:image/jpeg;base64,') || f.length > 400000) {
        return erro('Foto inválida');
      }
      foto = f.split(',')[1];
    }
    await sql()`insert into produtos (produto, preco, quantidade, provincia, nome, telefone, foto, pin_hash)
      values (${String(b.produto).slice(0, 80)}, ${String(b.preco).slice(0, 40)},
      ${String(b.quantidade || '').slice(0, 40)}, ${String(b.provincia || '').slice(0, 40)},
      ${String(b.nome || '').slice(0, 60)}, ${String(b.telefone).slice(0, 20)},
      ${foto}, ${hash(pin)})`;
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json();
    const rows = await sql()`update produtos set vendido = ${!!b.vendido}
      where id = ${Number(b.id)} and pin_hash = ${hash(String(b.pin || ''))} returning id`;
    if (!rows.length) return erro('PIN errado', 403);
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const b = await req.json();
    const rows = await sql()`delete from produtos
      where id = ${Number(b.id)} and pin_hash = ${hash(String(b.pin || ''))} returning id`;
    if (!rows.length) return erro('PIN errado', 403);
    return NextResponse.json({ ok: true });
  } catch {
    return erro('Erro', 500);
  }
}
