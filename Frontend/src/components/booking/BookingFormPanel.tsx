import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import type { BookingEventType, TimeSlot } from '@/types';
import type { BookingPayload } from '@/api/booking';

interface Props {
  eventType: BookingEventType;
  selectedSlot: TimeSlot;
  onBack: () => void;
  onSubmit: (payload: BookingPayload) => Promise<void>;
}

export default function BookingFormPanel({ eventType, selectedSlot, onBack, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email';

    for (const q of eventType.questions) {
      if (q.is_required && !answers[q.id]?.trim()) {
        errs[`q_${q.id}`] = 'This field is required';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        start_time: selectedSlot.start_time,
        invitee_name: name.trim(),
        invitee_email: email.trim(),
        notes: notes.trim() || undefined,
        answers: eventType.questions
          .filter(q => answers[q.id]?.trim())
          .map(q => ({ question_id: q.id, answer: answers[q.id].trim() })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter your details</h2>
      <p className="text-sm text-gray-500 mb-6">
        Meeting at{' '}
        <span className="font-medium text-gray-700">{selectedSlot.display}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="invitee-name">Your Name *</Label>
          <Input
            id="invitee-name"
            value={name}
            onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
            placeholder="Jane Smith"
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="invitee-email">Email Address *</Label>
          <Input
            id="invitee-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
            placeholder="jane@example.com"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Custom questions */}
        {eventType.questions.map(q => (
          <div key={q.id}>
            <Label htmlFor={`q-${q.id}`}>
              {q.label} {q.is_required ? '*' : '(optional)'}
            </Label>
            <Textarea
              id={`q-${q.id}`}
              value={answers[q.id] || ''}
              onChange={e => {
                setAnswers(p => ({ ...p, [q.id]: e.target.value }));
                if (errors[`q_${q.id}`]) setErrors(p => ({ ...p, [`q_${q.id}`]: '' }));
              }}
              rows={2}
            />
            {errors[`q_${q.id}`] && (
              <p className="text-xs text-red-600 mt-1">{errors[`q_${q.id}`]}</p>
            )}
          </div>
        ))}

        <div>
          <Label htmlFor="invitee-notes">Additional Notes (optional)</Label>
          <Textarea
            id="invitee-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything you'd like to share before the meeting..."
            maxLength={2000}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Event'}
        </Button>
      </form>
    </div>
  );
}
