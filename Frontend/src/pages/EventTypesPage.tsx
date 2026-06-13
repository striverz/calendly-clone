import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import EventTypeCard from '@/components/event-types/EventTypeCard';
import EventTypeFormModal from '@/components/event-types/EventTypeFormModal';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { getEventTypes, createEventType, updateEventType, deleteEventType } from '@/api/eventTypes';
import type { EventType, EventTypeFormData } from '@/types';
import toast from 'react-hot-toast';

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [deleting, setDeleting] = useState<EventType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventTypes();
      setEventTypes(data);
    } catch {
      toast.error('Failed to load event types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: EventTypeFormData) => {
    await createEventType(data);
    toast.success('Event type created!');
    await load();
  };

  const handleEdit = async (data: EventTypeFormData) => {
    if (!editing) return;
    await updateEventType(editing.id, data);
    toast.success('Event type updated!');
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteEventType(deleting.id);
      toast.success('Event type deleted');
      setDeleting(null);
      await load();
    } catch {
      toast.error('Failed to delete event type');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Event Types"
        description="Manage your scheduling event types and share them with others."
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            New Event Type
          </Button>
        }
      />

      {loading ? (
        <PageLoader />
      ) : eventTypes.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-16 h-16" />}
          title="No event types yet"
          description="Create your first event type to start sharing your availability and let others book time with you."
          action={
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event Type
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {eventTypes.map(et => (
            <EventTypeCard
              key={et.id}
              eventType={et}
              onEdit={et => { setEditing(et); setFormOpen(true); }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <EventTypeFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={editing ? handleEdit : handleCreate}
        initialData={editing}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Event Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">"{deleting?.name}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
