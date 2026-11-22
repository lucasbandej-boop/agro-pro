import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { criarSessao, hashSenha, lerSessao, verificarSenha } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = () => neon(process.env.DATABASE_URL!);
const erro = (m: string, s = 400) => NextResponse.json({ erro: m }, { status: s });

function comSessao(res: NextResponse, id: number) {
  res.cookies.set('sessao', criarSessao(id), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

function limparTelefone(t: unknown) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.startsWith('244') && d.length === 12) d = d.slice(3);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const id = lerSessao(req);
    if (!id) return NextResponse.json({ agricultor: null });
    const r = await sql()`select id, nome, telefone, provincia from agricultores where id = ${id}`;
    return NextResponse.json({ agricultor: r[0] || null });
  } catch {
    return erro('Erro', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.AUTH_SECRET) return erro('Servidor sem AUTH_SECRET', 500);
    const b = await req.json();
    const db = sql();

    if (b.acao === 'sair') {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete('sessao');
      return res;
    }

    const telefone = limparTelefone(b.telefone);
    const senha = String(b.senha || '');
    if (telefone.length !== 9) return erro('Telefone inválido (9 números)');

    if (b.acao === 'registar') {
      const nome = String(b.nome || '').trim().slice(0, 60);
      if (!nome || senha.length < 6) return erro('Nome e senha (mínimo 6) são obrigatórios');
      const r = await db`insert into agricultores (nome, telefone, provincia, senha_hash)
        values (${nome}, ${telefone}, ${String(b.provincia || '').slice(0, 40)}, ${hashSenha(senha)})
        on conflict (telefone) do nothing returning id`;
      if (!r.length) return erro('Este telefone já está registado', 409);
      return comSessao(NextResponse.json({ ok: true }), Number(r[0].id));
    }

    if (b.acao === 'entrar') {
      const r = await db`select id, senha_hash from agricultores where telefone = ${telefone}`;
      if (!r.length || !verificarSenha(senha, String(r[0].senha_hash))) {
        return erro('Telefone ou senha errados', 401);
      }
      return comSessao(NextResponse.json({ ok: true }), Number(r[0].id));
    }

    return erro('Ação inválida');
  } catch {
    return erro('Erro', 500);
  }
}
