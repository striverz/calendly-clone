import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Meeting } from '@/types';

interface Props {
  meeting: Meeting | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function CancelModal({ meeting, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!meeting} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Meeting</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel{' '}
            <span className="font-medium text-gray-900">{meeting?.event_type_name}</span>
            {' '}with{' '}
            <span className="font-medium text-gray-900">{meeting?.invitee_name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Let the invitee know why you're cancelling..."
            maxLength={1000}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Meeting
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Cancelling...' : 'Cancel Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
