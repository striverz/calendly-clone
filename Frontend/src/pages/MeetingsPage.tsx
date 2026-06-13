import { useState, useEffect, useCallback } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import MeetingCard from '@/components/meetings/MeetingCard';
import CancelModal from '@/components/meetings/CancelModal';
import { getMeetings, cancelMeeting, type MeetingType } from '@/api/meetings';
import type { Meeting, Pagination } from '@/types';
import toast from 'react-hot-toast';

const TABS: { value: MeetingType; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MeetingsPage() {
  const [tab, setTab] = useState<MeetingType>('upcoming');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Meeting | null>(null);

  const load = useCallback(async (type: MeetingType, pg: number) => {
    setLoading(true);
    try {
      const res = await getMeetings(type, pg, 10);
      setMeetings(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(tab, 1);
  }, [tab, load]);

  const handleTabChange = (value: string) => {
    setTab(value as MeetingType);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(tab, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return;
    try {
      await cancelMeeting(cancelTarget.id, reason);
      toast.success('Meeting cancelled');
      await load(tab, page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
      throw err;
    }
  };

  const emptyMessages: Record<MeetingType, { title: string; desc: string }> = {
    upcoming: {
      title: 'No upcoming meetings',
      desc: 'When someone books a meeting with you, it will appear here.',
    },
    past: { title: 'No past meetings', desc: 'Your completed meetings will appear here.' },
    cancelled: { title: 'No cancelled meetings', desc: 'Cancelled meetings will appear here.' },
    all: { title: 'No meetings', desc: 'Your meetings will appear here.' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Meetings"
        description="View and manage all your scheduled meetings."
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t.value} value={t.value}>
            {loading ? (
              <PageLoader />
            ) : meetings.length === 0 ? (
              <EmptyState
                icon={<Users className="w-14 h-14" />}
                title={emptyMessages[t.value].title}
                description={emptyMessages[t.value].desc}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {meetings.map(m => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onCancel={t.value === 'upcoming' ? setCancelTarget : undefined}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing {meetings.length} of {pagination.total} meetings
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700 px-2">
                        {page} / {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === pagination.pages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CancelModal
        meeting={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
