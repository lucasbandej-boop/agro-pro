import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const segredo = () => process.env.AUTH_SECRET || '';
const assinar = (t: string) => createHmac('sha256', segredo()).update(t).digest('hex');

export function hashSenha(senha: string) {
  const sal = randomBytes(16).toString('hex');
  return sal + ':' + scryptSync(senha, sal, 32).toString('hex');
}

export function verificarSenha(senha: string, guardado: string) {
  const [sal, h] = guardado.split(':');
  if (!sal || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = scryptSync(senha, sal, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function criarSessao(id: number) {
  const corpo = `${id}.${Date.now() + 30 * 24 * 3600 * 1000}`;
  return `${corpo}.${assinar(corpo)}`;
}

export function lerSessao(req: NextRequest): number | null {
  if (!segredo()) return null;
  const c = req.cookies.get('sessao')?.value;
  if (!c) return null;
  const [id, exp, sig] = c.split('.');
  if (!id || !exp || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(assinar(`${id}.${exp}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return Number(id);
}
