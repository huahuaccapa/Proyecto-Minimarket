'use client';

import { useMemo, useState } from 'react';
import { FolderTree, Plus, Search, Tags, Pencil } from 'lucide-react';
import { Modal, PageTitle } from '../components/ui';

const empty = { name: '', description: '', active: true };

function CatalogPanel({ title, description, icon: Icon, items, type, onOpen }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-black/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-mint text-forest"><Icon size={21} /></span><div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-sm text-black/45">{description}</p></div></div>
          <button className="btn-primary shrink-0 px-4" onClick={() => onOpen(type)}><Plus size={17} /><span className="hidden sm:inline">Crear</span></button>
        </div>
        <div className="relative mt-5"><Search className="absolute left-4 top-3.5 text-black/30" size={18} /><input className="field pl-11" placeholder={`Buscar ${title.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>
      <div className="divide-y divide-black/5">
        {filtered.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 p-5 hover:bg-cream/60"><div><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-black/45">{item.description || 'Sin descripción'}</p></div><button className="rounded-xl p-2 hover:bg-black/5" onClick={() => onOpen(type, item)} aria-label={`Editar ${item.name}`}><Pencil size={17} /></button></article>)}
        {!filtered.length && <p className="p-8 text-center text-sm text-black/40">No se encontraron registros.</p>}
      </div>
    </section>
  );
}

export default function CatalogsView({ categories, brands, onSave }) {
  const [editing, setEditing] = useState(null);
  const open = (type, item = empty) => setEditing({ type, item: { ...item } });
  const submit = async (event) => { event.preventDefault(); await onSave(editing.type, editing.item); setEditing(null); };
  return (
    <>
      <PageTitle eyebrow="Organización del catálogo" title="Categorías y marcas" description="Crea estas opciones primero para luego asignarlas a cada producto sin escribir nombres diferentes por error." />
      <div className="grid gap-6 xl:grid-cols-2">
        <CatalogPanel title="Categorías" description="Agrupan productos del mismo tipo." icon={FolderTree} items={categories} type="category" onOpen={open} />
        <CatalogPanel title="Marcas" description="Identifican al fabricante o nombre comercial." icon={Tags} items={brands} type="brand" onOpen={open} />
      </div>
      {editing && <Modal title={`${editing.item.id ? 'Editar' : 'Nueva'} ${editing.type === 'category' ? 'categoría' : 'marca'}`} onClose={() => setEditing(null)}><form onSubmit={submit}><label className="text-sm font-bold">Nombre<input required autoFocus className="field mt-2" value={editing.item.name} onChange={(event) => setEditing({ ...editing, item: { ...editing.item, name: event.target.value } })} /></label><label className="mt-5 block text-sm font-bold">Descripción<textarea rows="3" className="field mt-2 resize-none" placeholder="Describe brevemente para qué productos se usará" value={editing.item.description} onChange={(event) => setEditing({ ...editing, item: { ...editing.item, description: event.target.value } })} /></label><div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Guardar</button></div></form></Modal>}
    </>
  );
}