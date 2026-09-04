import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { PrototypeItem, PrototypeSection, PrototypeSectionType } from '../../types';
import { Modal, ModalHeader } from '../ui';
import { Input, Textarea } from '../form';
import { uid } from '../../lib/utils';
import { SECTION_TYPE_LABELS } from '../../lib/prototypeSections';

interface ItemField {
  key: keyof PrototypeItem;
  label: string;
  textarea?: boolean;
  full?: boolean;
}

const ITEM_FIELDS: Record<PrototypeSectionType, ItemField[]> = {
  hero: [],
  features: [
    { key: 'title', label: 'Feature name' },
    { key: 'description', label: 'Description', textarea: true, full: true },
  ],
  services: [
    { key: 'title', label: 'Service name' },
    { key: 'description', label: 'Description', textarea: true, full: true },
    { key: 'image', label: 'Image label' },
  ],
  products: [
    { key: 'title', label: 'Product name' },
    { key: 'meta', label: 'Price / label' },
    { key: 'description', label: 'Description', textarea: true, full: true },
    { key: 'image', label: 'Image label' },
    { key: 'cta', label: 'Button text' },
  ],
  testimonials: [
    { key: 'title', label: 'Name' },
    { key: 'meta', label: 'Role / company' },
    { key: 'description', label: 'Review', textarea: true, full: true },
  ],
  cta: [],
  stats: [
    { key: 'title', label: 'Value (real figure)' },
    { key: 'meta', label: 'Label' },
    { key: 'description', label: 'Note', textarea: true, full: true },
  ],
  gallery: [{ key: 'image', label: 'Image label' }],
  logos: [{ key: 'title', label: 'Logo name' }],
  contact: [],
  faq: [
    { key: 'title', label: 'Question' },
    { key: 'description', label: 'Answer', textarea: true, full: true },
  ],
  team: [
    { key: 'title', label: 'Name' },
    { key: 'meta', label: 'Role' },
    { key: 'description', label: 'Bio', textarea: true, full: true },
    { key: 'image', label: 'Portrait label' },
  ],
  pricing: [
    { key: 'title', label: 'Plan name' },
    { key: 'meta', label: 'Price' },
    { key: 'description', label: 'What is included', textarea: true, full: true },
    { key: 'cta', label: 'Button text' },
  ],
  blog: [
    { key: 'title', label: 'Article title' },
    { key: 'meta', label: 'Category · Date' },
    { key: 'description', label: 'Excerpt', textarea: true, full: true },
    { key: 'image', label: 'Image label' },
  ],
  cards: [
    { key: 'title', label: 'Card title' },
    { key: 'description', label: 'Description', textarea: true, full: true },
    { key: 'image', label: 'Image label' },
  ],
  text: [],
};

const HAS_ITEMS: PrototypeSectionType[] = [
  'features', 'services', 'products', 'testimonials', 'stats', 'gallery',
  'logos', 'faq', 'team', 'pricing', 'blog', 'cards',
];

interface SectionEditModalProps {
  section: PrototypeSection | null;
  onClose: () => void;
  onSave: (section: PrototypeSection) => void;
}

export default function SectionEditModal({ section, onClose, onSave }: SectionEditModalProps) {
  const [form, setForm] = useState<PrototypeSection | null>(() => (section ? JSON.parse(JSON.stringify(section)) : null));

  if (!section || !form) return null;

  const set = <K extends keyof PrototypeSection>(key: K, value: PrototypeSection[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setItem = (id: string, key: keyof PrototypeItem, value: string) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
          }
        : prev
    );
  };

  const addItem = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: [...prev.items, { id: uid(), title: '', description: '', meta: '', image: '', cta: '' }],
          }
        : prev
    );
  };

  const removeItem = (id: string) => {
    setForm((prev) => (prev ? { ...prev, items: prev.items.filter((it) => it.id !== id) } : prev));
  };

  const fields = ITEM_FIELDS[form.type];

  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader
        title={`Edit ${SECTION_TYPE_LABELS[form.type]} section`}
        subtitle="Changes apply to the live preview immediately after saving."
        onClose={onClose}
      />
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Heading"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Section heading"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label={form.type === 'text' ? 'Body copy' : 'Subtitle / description'}
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="Supporting text shown under the heading"
              className="min-h-[80px]"
            />
          </div>
          {(form.type === 'hero' || form.type === 'text') && (
            <div>
              <label className="label">Alignment</label>
              <div className="flex gap-2">
                {(['left', 'center'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => set('align', a)}
                    className={a === form.align ? 'chip chip-active' : 'chip'}
                  >
                    {a === 'left' ? 'Left' : 'Centered'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {form.type === 'hero' && (
            <Input
              label="Hero image label"
              hint="Leave empty for a text-only hero"
              value={form.image ?? ''}
              onChange={(e) => set('image', e.target.value)}
              placeholder="e.g. Studio photography"
            />
          )}
          {(form.type === 'hero' || form.type === 'cta' || form.type === 'contact' || form.type === 'text') && (
            <div className="sm:col-span-2">
              <Input
                label="Button text (call to action)"
                value={form.cta?.label ?? ''}
                onChange={(e) => set('cta', { label: e.target.value, href: form.cta?.href })}
                placeholder="e.g. Get in touch"
              />
            </div>
          )}
        </div>

        {HAS_ITEMS.includes(form.type) && (
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {form.type === 'testimonials' ? 'Reviews' : form.type === 'faq' ? 'Questions' : 'Cards / items'}
              </h3>
              <button onClick={addItem} className="btn-secondary btn-sm">
                <Plus size={13} /> Add item
              </button>
            </div>
            {form.items.length === 0 && (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">
                No items yet — add one to populate this section.
              </p>
            )}
            <div className="space-y-4">
              {form.items.map((item, idx) => (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Item {idx + 1}</span>
                    <button onClick={() => removeItem(item.id)} className="icon-btn !h-7 !w-7 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-400" aria-label="Remove item">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                        {f.textarea ? (
                          <Textarea
                            label={f.label}
                            value={(item[f.key] as string) ?? ''}
                            onChange={(e) => setItem(item.id, f.key, e.target.value)}
                            className="min-h-[64px]"
                          />
                        ) : (
                          <Input
                            label={f.label}
                            value={(item[f.key] as string) ?? ''}
                            onChange={(e) => setItem(item.id, f.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Blueprint: {form.purpose ? `${form.purpose} ` : ''}
          {form.contentDirection ? `Content direction: ${form.contentDirection}` : ''}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
        <button onClick={onClose} className="btn-ghost">
          <X size={15} /> Cancel
        </button>
        <button
          onClick={() => {
            onSave(form);
            onClose();
          }}
          className="btn-primary"
        >
          Save section
        </button>
      </div>
    </Modal>
  );
}