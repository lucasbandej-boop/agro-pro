'use client';
import { useEffect, useState } from 'react';

type Produto = {
  id: number; produto: string; preco: string; quantidade: string;
  provincia: string; nome: string; telefone: string;
};

const vazio = { produto: '', preco: '', quantidade: '', provincia: '', nome: '', telefone: '' };
const campo = { width: '100%', padding: 11, margin: '5px 0', fontSize: 16, border: '1px solid #bbb', borderRadius: 8, boxSizing: 'border-box' } as const;

export default function Home() {
  const [lista, setLista] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(vazio);
  const [msg, setMsg] = useState('');

  async function carregar(q = busca) {
    const r = await fetch('/api/produtos?q=' + encodeURIComponent(q));
    if (r.ok) setLista(await r.json());
  }
  useEffect(() => { carregar(''); }, []);

  async function publicar() {
    if (!form.produto || !form.preco || !form.telefone) {
      setMsg('Preencha produto, preço e telefone.'); return;
    }
    const r = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) { setForm(vazio); setMsg('Publicado!'); carregar(); }
    else setMsg('Erro ao publicar.');
  }

  function whatsapp(p: Produto) {
    let tel = p.telefone.replace(/\D/g, '');
    if (!tel.startsWith('244')) tel = '244' + tel;
    const txt = `Olá! Vi o seu anúncio de ${p.produto} no Agro Angola.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
  }

  const chaves = Object.keys(vazio) as (keyof typeof vazio)[];
  const nomes = { produto: 'Produto (ex: Tomate)', preco: 'Preço (ex: 500 Kz/kg)', quantidade: 'Quantidade (ex: 200 kg)', provincia: 'Província', nome: 'O seu nome', telefone: 'Telefone (ex: 923456789)' };

  return (
    <>
      <header style={{ background: '#2e7d32', color: '#fff', padding: 14, textAlign: 'center', fontSize: 20 }}>
        🌱 Agro Angola
      </header>
      <main style={{ padding: 12, maxWidth: 600, margin: 'auto' }}>
        <h2>Procurar produto</h2>
        <input style={campo} placeholder="Ex: tomate, cebola, mandioca..." value={busca}
          onChange={e => { setBusca(e.target.value); carregar(e.target.value); }} />
        {lista.length === 0 && <p>Sem produtos ainda.</p>}
        {lista.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 10, padding: 12, margin: '10px 0', boxShadow: '0 1px 3px #0002' }}>
            <h3 style={{ margin: '0 0 4px' }}>{p.produto} - {p.preco}</h3>
            <div>{[p.quantidade, p.provincia, p.nome].filter(Boolean).join(' • ')}</div>
            <a href={whatsapp(p)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: '#25d366', color: '#fff', padding: 10, borderRadius: 8, textDecoration: 'none', marginTop: 8, fontWeight: 'bold' }}>
              Falar no WhatsApp
            </a>
          </div>
        ))}

        <h2>Sou agricultor: publicar</h2>
        {chaves.map(k => (
          <input key={k} style={campo} placeholder={nomes[k]} value={form[k]}
            type={k === 'telefone' ? 'tel' : 'text'}
            onChange={e => setForm({ ...form, [k]: e.target.value })} />
        ))}
        <button onClick={publicar}
          style={{ ...campo, background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          Publicar
        </button>
        {msg && <p>{msg}</p>}
      </main>
    </>
  );
}
