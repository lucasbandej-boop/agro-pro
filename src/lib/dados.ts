export type Produto = {
  id: number; produto: string; preco: string; quantidade: string;
  provincia: string; nome: string; telefone: string;
  vendido: boolean; tem_foto: boolean;
};

export const PROVINCIAS = ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando', 'Cuanza Norte', 'Cuanza Sul', 'Cubango', 'Cunene', 'Huambo', 'Huíla', 'Icolo e Bengo', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Moxico Leste', 'Namibe', 'Uíge', 'Zaire'];

export function whatsapp(p: Produto) {
  let tel = p.telefone.replace(/\D/g, '');
  if (!tel.startsWith('244')) tel = '244' + tel;
  const txt = `Olá! Vi o seu anúncio de ${p.produto} no Agro Angola.`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
}
