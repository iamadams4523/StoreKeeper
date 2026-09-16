'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  PackagePlus,
  PackageMinus,
  UserPlus,
  UserCog,
  ToggleLeft,
  X,
  History,
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';

import {
  getPendingActions,
  getActionHistory,
  approvePendingAction,
  rejectPendingAction,
} from '@/app/actions/approvals';

// ============================================================
// Types
// ============================================================

type ActionType =
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'CREATE_STAFF'
  | 'UPDATE_STAFF'
  | 'TOGGLE_STAFF_STATUS';

type ActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface PendingRow {
  id: string;
  actionType: ActionType;
  targetId: string | null;
  payload: Record<string, unknown>;
  status: ActionStatus;
  createdAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  requestedBy: { id: string; firstName: string; lastName: string };
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  branch: { id: string; name: string };
}

interface ActionMeta {
  label: string;
  icon: React.ElementType;
  tone: string;
}

// ============================================================
// Display helpers
// ============================================================

const ACTION_META: Record<ActionType, ActionMeta> = {
  CREATE_PRODUCT: {
    label: 'New product',
    icon: PackagePlus,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  UPDATE_PRODUCT: {
    label: 'Product update',
    icon: PackagePlus,
    tone: 'text-blue-600 bg-blue-50',
  },
  DELETE_PRODUCT: {
    label: 'Delete product',
    icon: PackageMinus,
    tone: 'text-rose-600 bg-rose-50',
  },
  CREATE_STAFF: {
    label: 'New staff member',
    icon: UserPlus,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  UPDATE_STAFF: {
    label: 'Staff update',
    icon: UserCog,
    tone: 'text-blue-600 bg-blue-50',
  },
  TOGGLE_STAFF_STATUS: {
    label: 'Staff status change',
    icon: ToggleLeft,
    tone: 'text-orange-600 bg-orange-50',
  },
};

function summarizePayload(action: PendingRow): string {
  const p = action.payload as Record<string, unknown>;

  switch (action.actionType) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT':
      return `${p.name} — SKU ${p.sku} — ${p.stock} units @ ₦${Number(
        p.sellingPrice,
      ).toLocaleString()}`;

    case 'DELETE_PRODUCT':
      return `Requesting deletion of product (ID: ${action.targetId})`;

    case 'CREATE_STAFF':
      return `${p.firstName} ${p.lastName} — ${p.email} (Sales Assistant)`;

    case 'UPDATE_STAFF':
      return `Update details to: ${p.firstName} ${p.lastName} — ${p.email}`;

    case 'TOGGLE_STAFF_STATUS': {
      const current = p.currentStatus as string;
      const next = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      return `Change status: ${current} → ${next}`;
    }

    default:
      return 'Unknown request';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ============================================================
// Page
// ============================================================

export default function AdminApprovals() {
  const [view, setView] = useState<'pending' | 'history'>('pending');

  const [pending, setPending] = useState<PendingRow[]>([]);
  const [history, setHistory] = useState<PendingRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<PendingRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadPending() {
    const result = await getPendingActions();

    if (result.success && result.data) {
      setPending(result.data as unknown as PendingRow[]);
    } else {
      alert(result.error);
    }
  }

  async function loadHistory() {
    const result = await getActionHistory();

    if (result.success && result.data) {
      setHistory(result.data as unknown as PendingRow[]);
    } else {
      alert(result.error);
    }
  }

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      await Promise.all([loadPending(), loadHistory()]);
      setIsLoading(false);
    }

    loadAll();
  }, []);

  const branches = useMemo(() => {
    const names = new Set(pending.map((p) => p.branch.name));
    return Array.from(names);
  }, [pending]);

  // ----------------------------------------------------------
  // Approve
  // ----------------------------------------------------------

  const handleApprove = async (action: PendingRow) => {
    if (processingId) return;

    if (!confirm(`Approve this request?\n\n${summarizePayload(action)}`)) {
      return;
    }

    try {
      setProcessingId(action.id);

      const result = await approvePendingAction(action.id);

      if (!result.success) {
        // Left PENDING on the server when re-validation fails —
        // surface why instead of just refreshing silently.
        alert(result.error);
        return;
      }

      await Promise.all([loadPending(), loadHistory()]);
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  // ----------------------------------------------------------
  // Reject
  // ----------------------------------------------------------

  const openReject = (action: PendingRow) => {
    setRejectTarget(action);
    setRejectReason('');
  };

  const closeReject = () => {
    if (processingId) return;
    setRejectTarget(null);
    setRejectReason('');
  };

  const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!rejectTarget) return;

    try {
      setProcessingId(rejectTarget.id);

      const result = await rejectPendingAction(rejectTarget.id, rejectReason);

      if (!result.success) {
        alert(result.error);
        return;
      }

      setRejectTarget(null);
      setRejectReason('');

      await Promise.all([loadPending(), loadHistory()]);
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading approval queue...</p>
          </div>
        </main>
      </div>
    );
  }

  const rows = view === 'pending' ? pending : history;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Pending Approvals
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Review and approve changes submitted by branch managers.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView('pending')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock size={16} />
                Pending ({pending.length})
              </button>

              <button
                onClick={() => setView('history')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <History size={16} />
                History
              </button>
            </div>
          </header>

          {/* KPI STRIP */}
          {view === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Awaiting Review
                  </p>
                  <h3 className="text-2xl font-bold">{pending.length}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Branches with Requests
                  </p>
                  <h3 className="text-2xl font-bold">{branches.length}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                  <User size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Requesters
                  </p>
                  <h3 className="text-2xl font-bold">
                    {new Set(pending.map((p) => p.requestedBy.id)).size}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* LIST */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {rows.length === 0 ? (
              <div className="py-16 text-center">
                <ClipboardList
                  size={40}
                  className="mx-auto text-slate-300 mb-3"
                />
                <p className="font-medium text-slate-600">
                  {view === 'pending'
                    ? 'No requests awaiting approval.'
                    : 'No reviewed requests yet.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((action) => {
                  const meta = ACTION_META[action.actionType];
                  const Icon = meta.icon;

                  return (
                    <li
                      key={action.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div
                        className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${meta.tone}`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">
                            {meta.label}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Building2 size={12} />
                            {action.branch.name}
                          </span>

                          {view === 'history' && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                action.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {action.status === 'APPROVED' ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              {action.status === 'APPROVED'
                                ? 'Approved'
                                : 'Rejected'}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 truncate">
                          {summarizePayload(action)}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Requested by {action.requestedBy.firstName}{' '}
                          {action.requestedBy.lastName} ·{' '}
                          {formatDate(action.createdAt)}
                        </p>

                        {view === 'history' && action.rejectionReason && (
                          <p className="text-xs text-rose-600 mt-1">
                            Reason: {action.rejectionReason}
                          </p>
                        )}

                        {view === 'history' && action.reviewedBy && (
                          <p className="text-xs text-slate-400">
                            Reviewed by {action.reviewedBy.firstName}{' '}
                            {action.reviewedBy.lastName}
                            {action.reviewedAt
                              ? ` · ${formatDate(action.reviewedAt)}`
                              : ''}
                          </p>
                        )}
                      </div>

                      {view === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => openReject(action)}
                            disabled={processingId === action.id}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => handleApprove(action)}
                            disabled={processingId === action.id}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {processingId === action.id
                              ? 'Approving...'
                              : 'Approve'}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* REJECT MODAL */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold">Reject Request</h2>

              <button
                onClick={closeReject}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                {summarizePayload(rejectTarget)}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Reason for rejection
                </label>

                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Let the manager know why this was rejected..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReject}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={processingId === rejectTarget.id}
                  className="px-5 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                >
                  {processingId === rejectTarget.id
                    ? 'Rejecting...'
                    : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
