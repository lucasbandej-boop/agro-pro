'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { PROVINCIAS, Produto } from '@/lib/dados';
import Cartao from '@/components/Cartao';

type Agricultor = { id: number; nome: string; telefone: string; provincia: string };

const campo = { width: '100%', padding: 12, margin: '5px 0', fontSize: 16, border: '1px solid #cfd8cf', borderRadius: 10, boxSizing: 'border-box', background: '#fff' } as const;
const verde = { ...campo, background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 'bold' } as const;
const botao = { padding: '9px 12px', fontSize: 14, border: '1px solid #bbb', borderRadius: 8, background: '#fff', flex: 1 } as const;

function comprimir(file: File): Promise<string> {
  return new Promise((ok, falha) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const esc = Math.min(1, 700 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc);
      c.height = Math.round(img.height * esc);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.55));
    };
    img.onerror = () => falha(new Error('foto'));
    img.src = url;
  });
}

export default function Agricultor() {
  const [eu, setEu] = useState<Agricultor | null | undefined>(undefined);
  const [modo, setModo] = useState<'entrar' | 'registar'>('entrar');
  const [conta, setConta] = useState({ nome: '', telefone: '', provincia: '', senha: '' });
  const [form, setForm] = useState({ produto: '', preco: '', quantidade: '' });
  const [foto, setFoto] = useState('');
  const [meus, setMeus] = useState<Produto[]>([]);
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function carregarMeus() {
    const r = await fetch('/api/produtos?meus=1');
    if (r.ok) setMeus(await r.json());
  }
  async function carregarEu() {
    const r = await fetch('/api/auth');
    const d = await r.json();
    setEu(d.agricultor);
    if (d.agricultor) carregarMeus();
  }
  useEffect(() => { carregarEu(); }, []);

  async function autenticar() {
    setOcupado(true); setMsg('');
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...conta, acao: modo }),
    });
    setOcupado(false);
    if (r.ok) { setConta({ nome: '', telefone: '', provincia: '', senha: '' }); carregarEu(); }
    else setMsg((await r.json()).erro || 'Erro');
  }

  async function sair() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'sair' }) });
    setEu(null); setMeus([]);
  }

  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setFoto(await comprimir(f)); } catch { setMsg('Não foi possível ler a foto.'); }
  }

  async function publicar() {
    if (!form.produto || !form.preco) { setMsg('Preencha produto e preço.'); return; }
    setOcupado(true); setMsg('');
    const r = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, foto }),
    });
    setOcupado(false);
    if (r.ok) { setForm({ produto: '', preco: '', quantidade: '' }); setFoto(''); setMsg('Publicado! ✅'); carregarMeus(); }
    else setMsg('Erro ao publicar.');
  }

  async function gerir(p: Produto, acao: 'vendido' | 'apagar') {
    if (acao === 'apagar' && !window.confirm('Apagar este anúncio?')) return;
    const r = await fetch('/api/produtos', {
      method: acao === 'apagar' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, vendido: !p.vendido }),
    });
    if (r.ok) carregarMeus();
  }

  return (
    <>
      <header style={{ background: 'linear-gradient(135deg,#1b5e20,#43a047)', color: '#fff', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 600, margin: 'auto' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>🌱 Área do agricultor</div>
          <Link href="/" style={{ color: '#fff', fontSize: 14 }}>← Ver anúncios</Link>
        </div>
      </header>
      <main style={{ padding: 12, maxWidth: 600, margin: 'auto' }}>
        {eu === undefined && <p>A carregar...</p>}

        {eu === null && (
          <>
            <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
              <button style={{ ...botao, background: modo === 'entrar' ? '#2e7d32' : '#fff', color: modo === 'entrar' ? '#fff' : '#222' }} onClick={() => { setModo('entrar'); setMsg(''); }}>Entrar</button>
              <button style={{ ...botao, background: modo === 'registar' ? '#2e7d32' : '#fff', color: modo === 'registar' ? '#fff' : '#222' }} onClick={() => { setModo('registar'); setMsg(''); }}>Registar</button>
            </div>
            {modo === 'registar' && (
              <>
                <input style={campo} placeholder="O seu nome" value={conta.nome} onChange={e => setConta({ ...conta, nome: e.target.value })} />
                <select style={campo} value={conta.provincia} onChange={e => setConta({ ...conta, provincia: e.target.value })}>
                  <option value="">Província</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </>
            )}
            <input style={campo} type="tel" placeholder="Telefone (ex: 923456789)" value={conta.telefone} onChange={e => setConta({ ...conta, telefone: e.target.value })} />
            <input style={campo} type="password" placeholder="Senha (mínimo 6)" value={conta.senha} onChange={e => setConta({ ...conta, senha: e.target.value })} />
            <button style={verde} disabled={ocupado} onClick={autenticar}>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
            {msg && <p style={{ color: '#c62828' }}>{msg}</p>}
          </>
        )}

        {eu && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
              <div>Olá, <b>{eu.nome}</b> 👋</div>
              <button style={{ ...botao, flex: 'none' }} onClick={sair}>Sair</button>
            </div>

            <h2>Novo anúncio</h2>
            <input style={campo} placeholder="Produto (ex: Tomate)" value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} />
            <input style={campo} placeholder="Preço (ex: 500 Kz/kg)" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
            <input style={campo} placeholder="Quantidade (ex: 200 kg)" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
            <input style={campo} type="file" accept="image/*" onChange={escolherFoto} />
            {foto && <img src={foto} alt="Pré-visualização" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10 }} />}
            <button style={verde} disabled={ocupado} onClick={publicar}>{ocupado ? 'A publicar...' : 'Publicar'}</button>
            {msg && <p>{msg}</p>}

            <h2>Os meus anúncios</h2>
            {meus.length === 0 && <p>Ainda não publicou nada.</p>}
            {meus.map(p => (
              <Cartao key={p.id} p={p} contacto={false}>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={botao} onClick={() => gerir(p, 'vendido')}>{p.vendido ? 'Voltar a disponível' : 'Marcar vendido'}</button>
                  <button style={botao} onClick={() => gerir(p, 'apagar')}>Apagar</button>
                </div>
              </Cartao>
            ))}
          </>
        )}
      </main>
    </>
  );
}
