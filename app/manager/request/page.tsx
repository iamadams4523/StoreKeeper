'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  PackagePlus,
  PackageMinus,
  UserPlus,
  UserCog,
  ToggleLeft,
} from 'lucide-react';

import { getMyRequests } from '@/app/actions/approvals';

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

interface RequestRow {
  id: string;
  actionType: ActionType;
  targetId: string | null;
  payload: Record<string, unknown>;
  status: ActionStatus;
  createdAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  branch: { id: string; name: string };
}

// ============================================================
// Display helpers
// ============================================================

interface ActionMeta {
  label: string;
  icon: React.ElementType;
  tone: string;
}
interface StatusMeta {
  label: string;
  icon: React.ElementType;
  tone: string;
}

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

const STATUS_META: Record<ActionStatus, StatusMeta> = {
  PENDING: {
    label: 'Awaiting review',
    icon: Clock,
    tone: 'bg-amber-100 text-amber-700',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    tone: 'bg-emerald-100 text-emerald-700',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    tone: 'bg-rose-100 text-rose-700',
  },
};

function summarizePayload(action: RequestRow): string {
  const p = action.payload as Record<string, unknown>;

  switch (action.actionType) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT':
      return `${p.name} — SKU ${p.sku} — ${p.stock} units @ ₦${Number(
        p.sellingPrice,
      ).toLocaleString()}`;

    case 'DELETE_PRODUCT':
      return `Deletion of product (ID: ${action.targetId})`;

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

export default function ManagerRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | ActionStatus>('ALL');

  async function loadRequests() {
    const result = await getMyRequests();

    if (result.success && result.data) {
      setRequests(result.data as unknown as RequestRow[]);
    } else {
      alert(result.error);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Requests
            </h1>

            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Track the status of product and staff changes you&apos;ve
              submitted for admin approval.
            </p>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                setFilter(filter === 'PENDING' ? 'ALL' : 'PENDING')
              }
              className={`flex items-center gap-4 rounded-xl border p-5 shadow-sm text-left transition-colors ${
                filter === 'PENDING'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white hover:border-amber-200'
              }`}
            >
              <div className="shrink-0 rounded-lg bg-amber-100 p-3 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Awaiting Review
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {pendingCount}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter(filter === 'APPROVED' ? 'ALL' : 'APPROVED')
              }
              className={`flex items-center gap-4 rounded-xl border p-5 shadow-sm text-left transition-colors ${
                filter === 'APPROVED'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-200'
              }`}
            >
              <div className="shrink-0 rounded-lg bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Approved</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {approvedCount}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter(filter === 'REJECTED' ? 'ALL' : 'REJECTED')
              }
              className={`flex items-center gap-4 rounded-xl border p-5 shadow-sm text-left transition-colors ${
                filter === 'REJECTED'
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-slate-200 bg-white hover:border-rose-200'
              }`}
            >
              <div className="shrink-0 rounded-lg bg-rose-100 p-3 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {rejectedCount}
                </p>
              </div>
            </button>
          </div>

          {/* LIST */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <ClipboardList
                  size={40}
                  className="mx-auto text-slate-300 mb-3"
                />
                <p className="font-medium text-slate-600">
                  {filter === 'ALL'
                    ? "You haven't submitted any requests yet."
                    : 'Nothing here.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredRequests.map((request) => {
                  const actionMeta = ACTION_META[request.actionType];
                  const statusMeta = STATUS_META[request.status];
                  const ActionIcon = actionMeta.icon;
                  const StatusIcon = statusMeta.icon;

                  return (
                    <li
                      key={request.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div
                        className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${actionMeta.tone}`}
                      >
                        <ActionIcon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">
                            {actionMeta.label}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Building2 size={12} />
                            {request.branch.name}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusMeta.tone}`}
                          >
                            <StatusIcon size={12} />
                            {statusMeta.label}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 truncate">
                          {summarizePayload(request)}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Submitted {formatDate(request.createdAt)}
                        </p>

                        {request.status === 'REJECTED' &&
                          request.rejectionReason && (
                            <p className="text-xs text-rose-600 mt-1">
                              Reason: {request.rejectionReason}
                            </p>
                          )}

                        {request.status !== 'PENDING' && request.reviewedBy && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Reviewed by {request.reviewedBy.firstName}{' '}
                            {request.reviewedBy.lastName}
                            {request.reviewedAt
                              ? ` · ${formatDate(request.reviewedAt)}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
