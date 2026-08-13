'use client';

import { useMemo, useState } from 'react';
import {
  FolderTree,
  Pencil,
  Plus,
  Search,
  Tags,
} from 'lucide-react';
import { Modal, PageTitle } from '../components/ui';

const emptyItem = {
  name: '',
  description: '',
  active: true,
};

const catalogConfig = {
  category: {
    eyebrow: 'Organización de productos',
    title: 'Categorías',
    singular: 'categoría',
    description:
      'Crea y edita los tipos que usarás para organizar los productos del minimarket.',
    searchPlaceholder: 'Buscar categoría',
    emptyMessage: 'Todavía no hay categorías registradas.',
    Icon: FolderTree,
  },

  brand: {
    eyebrow: 'Organización de productos',
    title: 'Marcas',
    singular: 'marca',
    description:
      'Crea y edita las marcas que luego podrás asignar a cada producto.',
    searchPlaceholder: 'Buscar marca',
    emptyMessage: 'Todavía no hay marcas registradas.',
    Icon: Tags,
  },
};

export default function CatalogsView({
  type,
  items = [],
  onSave,
}) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const config =
    catalogConfig[type] ?? catalogConfig.category;

  const Icon = config.Icon;

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) =>
      `${item.name} ${item.description || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [items, search]);

  const openCreate = () => {
    setError('');
    setEditing({ ...emptyItem });
  };

  const openEdit = (item) => {
    setError('');
    setEditing({ ...item });
  };

  const closeModal = () => {
    if (!saving) {
      setEditing(null);
      setError('');
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      await onSave(type, {
        ...editing,
        name: editing.name.trim(),
        description: editing.description.trim(),
      });

      setEditing(null);
    } catch (saveError) {
      setError(
        saveError.message ||
          `No se pudo guardar la ${config.singular}.`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <button
            className="btn-primary"
            onClick={openCreate}
          >
            <Plus size={18} />
            Nueva {config.singular}
          </button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-4 top-3.5 text-black/30"
              size={18}
            />

            <input
              className="field pl-11"
              placeholder={config.searchPlaceholder}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </div>

        <div className="divide-y divide-black/5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between gap-4 p-5 hover:bg-cream/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-forest">
                  <Icon size={21} />
                </span>

                <div className="min-w-0">
                  <p className="truncate font-black">
                    {item.name}
                  </p>

                  <p className="mt-1 text-sm text-black/45">
                    {item.description || 'Sin descripción'}
                  </p>
                </div>
              </div>

              <button
                className="rounded-xl p-2 hover:bg-black/5"
                onClick={() => openEdit(item)}
                aria-label={`Editar ${item.name}`}
              >
                <Pencil size={17} />
              </button>
            </article>
          ))}

          {!filteredItems.length && (
            <p className="p-8 text-center text-sm text-black/40">
              {search
                ? 'No se encontraron registros.'
                : config.emptyMessage}
            </p>
          )}
        </div>
      </section>

      {editing && (
        <Modal
          title={`${editing.id ? 'Editar' : 'Nueva'} ${
            config.singular
          }`}
          onClose={closeModal}
        >
          <form onSubmit={submit}>
            <label className="text-sm font-bold">
              Nombre

              <input
                required
                autoFocus
                className="field mt-2"
                value={editing.name}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    name: event.target.value,
                  })
                }
              />
            </label>

            <label className="mt-5 block text-sm font-bold">
              Descripción

              <textarea
                rows="3"
                className="field mt-2 resize-none"
                placeholder="Describe brevemente para qué productos se usará"
                value={editing.description}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    description: event.target.value,
                  })
                }
              />
            </label>

            {error && (
              <p className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}