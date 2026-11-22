'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PROVINCIAS, Produto } from '@/lib/dados';
import Cartao from '@/components/Cartao';

const campo = { width: '100%', padding: 12, margin: '5px 0', fontSize: 16, border: '1px solid #cfd8cf', borderRadius: 10, boxSizing: 'border-box', background: '#fff' } as const;

export default function Home() {
  const [lista, setLista] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await fetch('/api/produtos?q=' + encodeURIComponent(busca) + '&provincia=' + encodeURIComponent(filtro));
      if (r.ok) setLista(await r.json());
      setACarregar(false);
    }, 300);
    return () => clearTimeout(t);
  }, [busca, filtro]);

  return (
    <>
      <header style={{ background: 'linear-gradient(135deg,#1b5e20,#43a047)', color: '#fff', padding: '16px 14px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 600, margin: 'auto' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>🌱 Agro Angola</div>
          <Link href="/agricultor" style={{ background: '#fff', color: '#1b5e20', padding: '8px 12px', borderRadius: 10, textDecoration: 'none', fontWeight: 'bold', fontSize: 14 }}>
            Sou agricultor
          </Link>
        </div>
        <p style={{ maxWidth: 600, margin: '14px auto 0', fontSize: 15 }}>
          Compre direto de quem produz. Fale com o agricultor pelo WhatsApp.
        </p>
      </header>
      <main style={{ padding: 12, maxWidth: 600, margin: 'auto' }}>
        <input style={campo} placeholder="🔍 Procurar: tomate, cebola, mandioca..." value={busca}
          onChange={e => setBusca(e.target.value)} />
        <select style={campo} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="">Todas as províncias</option>
          {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {aCarregar && <p>A carregar...</p>}
        {!aCarregar && lista.length === 0 && <p>Sem produtos para mostrar.</p>}
        {lista.map(p => <Cartao key={p.id} p={p} />)}
      </main>
    </>
  );
}
