import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug, EVENT_COLORS, DURATION_OPTIONS } from '@/utils/format';
import type { EventType, EventTypeFormData } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventTypeFormData) => Promise<void>;
  initialData?: EventType | null;
}

const defaultForm: EventTypeFormData = {
  name: '',
  slug: '',
  duration: 30,
  description: '',
  color: '#4F46E5',
  location: '',
};

export default function EventTypeFormModal({ open, onClose, onSubmit, initialData }: Props) {
  const [form, setForm] = useState<EventTypeFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EventTypeFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name,
          slug: initialData.slug,
          duration: initialData.duration,
          description: initialData.description || '',
          color: initialData.color,
          location: initialData.location || '',
        });
        setSlugEdited(true);
      } else {
        setForm(defaultForm);
        setSlugEdited(false);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const set = (field: keyof EventTypeFormData, value: string | number) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !slugEdited) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof EventTypeFormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.length > 255) errs.name = 'Max 255 characters';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Only lowercase letters, numbers, and hyphens';
    else if (form.slug.length > 100) errs.slug = 'Max 100 characters';
    if (!form.duration || form.duration < 5 || form.duration > 480)
      errs.duration = 'Duration must be between 5 and 480 minutes';
    if (form.description.length > 1000) errs.description = 'Max 1000 characters';
    if (form.location.length > 500) errs.location = 'Max 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Event Type' : 'New Event Type'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="et-name">Name *</Label>
            <Input
              id="et-name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="30 Minute Meeting"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="et-slug">URL Slug *</Label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-150 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent hover:border-gray-300">
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap select-none">
                /book/
              </span>
              <input
                id="et-slug"
                value={form.slug}
                onChange={e => {
                  setSlugEdited(true);
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
                className="flex-1 px-3 py-2 text-sm bg-white focus:outline-none text-gray-900 placeholder:text-gray-400"
                placeholder="30-minute-meeting"
              />
            </div>
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="et-duration">Duration *</Label>
            <select
              id="et-duration"
              value={form.duration}
              onChange={e => set('duration', Number(e.target.value))}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
            >
              {DURATION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => set('color', c.value)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: form.color === c.value
                      ? `0 0 0 3px white, 0 0 0 5px ${c.value}`
                      : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="et-location">Location</Label>
            <Input
              id="et-location"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Zoom, Google Meet, phone call..."
            />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="et-description">Description</Label>
            <Textarea
              id="et-description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add a description for your event type..."
              rows={3}
            />
            <p className="text-xs text-gray-400 text-right">{form.description.length}/1000</p>
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : initialData ? 'Save Changes' : 'Create Event Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
