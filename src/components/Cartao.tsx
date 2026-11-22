import type { ReactNode } from 'react';
import { Produto, whatsapp } from '@/lib/dados';

export default function Cartao({ p, contacto = true, children }: { p: Produto; contacto?: boolean; children?: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', margin: '12px 0', boxShadow: '0 2px 8px #0001', opacity: p.vendido ? 0.6 : 1 }}>
      {p.tem_foto && (
        <img src={`/api/foto/${p.id}`} alt={p.produto} loading="lazy"
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 19 }}>{p.produto}</h3>
          {p.vendido && <span style={{ background: '#c62828', color: '#fff', fontSize: 12, padding: '3px 9px', borderRadius: 6 }}>VENDIDO</span>}
        </div>
        <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 20, margin: '4px 0' }}>{p.preco}</div>
        <div style={{ color: '#555', fontSize: 14 }}>{[p.quantidade, p.provincia].filter(Boolean).join(' • ')}</div>
        <div style={{ color: '#555', fontSize: 14 }}>👤 {p.nome}</div>
        {contacto && !p.vendido && (
          <a href={whatsapp(p)} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', background: '#25d366', color: '#fff', padding: 11, borderRadius: 10, textDecoration: 'none', marginTop: 10, fontWeight: 'bold' }}>
            Falar no WhatsApp
          </a>
        )}
        {children}
      </div>
    </div>
  );
}
