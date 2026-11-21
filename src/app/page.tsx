'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

type Produto = {
  id: number; produto: string; preco: string; quantidade: string;
  provincia: string; nome: string; telefone: string;
  vendido: boolean; tem_foto: boolean;
};

const PROVINCIAS = ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando', 'Cuanza Norte', 'Cuanza Sul', 'Cubango', 'Cunene', 'Huambo', 'Huíla', 'Icolo e Bengo', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Moxico Leste', 'Namibe', 'Uíge', 'Zaire'];

const vazio = { produto: '', preco: '', quantidade: '', provincia: '', nome: '', telefone: '', pin: '' };
const campos: [keyof typeof vazio, string, string][] = [
  ['produto', 'Produto (ex: Tomate)', 'text'],
  ['preco', 'Preço (ex: 500 Kz/kg)', 'text'],
  ['quantidade', 'Quantidade (ex: 200 kg)', 'text'],
  ['nome', 'O seu nome', 'text'],
  ['telefone', 'Telefone (ex: 923456789)', 'tel'],
];
const campo = { width: '100%', padding: 11, margin: '5px 0', fontSize: 16, border: '1px solid #bbb', borderRadius: 8, boxSizing: 'border-box', background: '#fff' } as const;
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

export default function Home() {
  const [lista, setLista] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [form, setForm] = useState(vazio);
  const [foto, setFoto] = useState('');
  const [msg, setMsg] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function carregar() {
    const r = await fetch('/api/produtos?q=' + encodeURIComponent(busca) + '&provincia=' + encodeURIComponent(filtro));
    if (r.ok) setLista(await r.json());
  }
  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [busca, filtro]);

  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setFoto(await comprimir(f)); } catch { setMsg('Não foi possível ler a foto.'); }
  }

  async function publicar() {
    if (!form.produto || !form.preco || !form.telefone) { setMsg('Preencha produto, preço e telefone.'); return; }
    if (!/^\d{4}$/.test(form.pin)) { setMsg('Escolha um PIN de 4 números.'); return; }
    setAEnviar(true);
    const r = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, foto }),
    });
    setAEnviar(false);
    if (r.ok) { setForm(vazio); setFoto(''); setMsg('Publicado! Guarde o seu PIN.'); carregar(); }
    else setMsg('Erro ao publicar.');
  }

  async function gerir(p: Produto, acao: 'vendido' | 'apagar') {
    const pin = window.prompt('Escreva o PIN de 4 números deste anúncio:');
    if (!pin) return;
    if (acao === 'apagar' && !window.confirm('Apagar este anúncio?')) return;
    const r = await fetch('/api/produtos', {
      method: acao === 'apagar' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, pin, vendido: !p.vendido }),
    });
    if (r.ok) carregar();
    else window.alert(r.status === 403 ? 'PIN errado.' : 'Erro.');
  }

  function whatsapp(p: Produto) {
    let tel = p.telefone.replace(/\D/g, '');
    if (!tel.startsWith('244')) tel = '244' + tel;
    const txt = `Olá! Vi o seu anúncio de ${p.produto} no Agro Angola.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
  }

  return (
    <>
      <header style={{ background: '#2e7d32', color: '#fff', padding: 14, textAlign: 'center', fontSize: 20 }}>
        🌱 Agro Angola
      </header>
      <main style={{ padding: 12, maxWidth: 600, margin: 'auto' }}>
        <h2>Procurar produto</h2>
        <input style={campo} placeholder="Ex: tomate, cebola, mandioca..." value={busca}
          onChange={e => setBusca(e.target.value)} />
        <select style={campo} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="">Todas as províncias</option>
          {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {lista.length === 0 && <p>Sem produtos para mostrar.</p>}
        {lista.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 10, padding: 12, margin: '10px 0', boxShadow: '0 1px 3px #0002', opacity: p.vendido ? 0.6 : 1 }}>
            {p.tem_foto && (
              <img src={`/api/foto/${p.id}`} alt={p.produto} loading="lazy"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
            )}
            <h3 style={{ margin: '0 0 4px' }}>
              {p.produto} - {p.preco}
              {p.vendido && <span style={{ background: '#c62828', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 6, marginLeft: 8 }}>VENDIDO</span>}
            </h3>
            <div>{[p.quantidade, p.provincia, p.nome].filter(Boolean).join(' • ')}</div>
            {!p.vendido && (
              <a href={whatsapp(p)} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', background: '#25d366', color: '#fff', padding: 10, borderRadius: 8, textDecoration: 'none', marginTop: 8, fontWeight: 'bold' }}>
                Falar no WhatsApp
              </a>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={botao} onClick={() => gerir(p, 'vendido')}>
                {p.vendido ? 'Voltar a disponível' : 'Marcar vendido'}
              </button>
              <button style={botao} onClick={() => gerir(p, 'apagar')}>Apagar</button>
            </div>
          </div>
        ))}

        <h2>Sou agricultor: publicar</h2>
        {campos.map(([k, ph, tipo]) => (
          <input key={k} style={campo} placeholder={ph} type={tipo} value={form[k]}
            onChange={e => setForm({ ...form, [k]: e.target.value })} />
        ))}
        <select style={campo} value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })}>
          <option value="">Província</option>
          {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input style={campo} placeholder="PIN de 4 números (para apagar ou marcar vendido)"
          inputMode="numeric" maxLength={4} value={form.pin}
          onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} />
        <input style={campo} type="file" accept="image/*" onChange={escolherFoto} />
        {foto && <img src={foto} alt="Pré-visualização" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />}
        <button onClick={publicar} disabled={aEnviar}
          style={{ ...campo, background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          {aEnviar ? 'A publicar...' : 'Publicar'}
        </button>
        {msg && <p>{msg}</p>}
      </main>
    </>
  );
}
