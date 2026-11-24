import React, { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import type { EngineerSummary, Ticket, TicketComment, TicketPriority, TicketStatus } from '../types';

export default function DashboardPage() {
  const { user, logoutUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [engineers, setEngineers] = useState<EngineerSummary[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Ticket Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let endpoint = '/tickets/my';
      if (user.role === 'ENGINEER') endpoint = '/tickets/assigned';
      if (user.role === 'ADMIN') endpoint = '/admin/tickets';

      const res = await axiosClient.get<Ticket[]>(endpoint);
      setTickets(res.data);

      if (user.role === 'ADMIN') {
        const engRes = await axiosClient.get<EngineerSummary[]>('/admin/engineers');
        setEngineers(engRes.data);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const openTicketDetails = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await axiosClient.get<TicketComment[]>(`/tickets/${ticket.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosClient.post<Ticket>('/tickets', {
        title,
        description,
        errorLog: errorLog.trim() || null,
      });
      setTickets((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setErrorLog('');
      openTicketDetails(res.data); // Immediately showcase AI Triage results!
    } catch (err) {
      alert('Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: number, status: TicketStatus) => {
    try {
      const res = await axiosClient.patch<Ticket>(`/tickets/${ticketId}/status`, { status });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.data : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(res.data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleReassign = async (ticketId: number, engineerId: number) => {
    try {
      const res = await axiosClient.patch<Ticket>(`/admin/tickets/${ticketId}/assign/${engineerId}`);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.data : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(res.data);
    } catch (err) {
      alert('Failed to reassign ticket');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;
    try {
      const res = await axiosClient.post<TicketComment>(`/tickets/${selectedTicket.id}/comments`, {
        message: newComment,
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const priorityBadge = (p: TicketPriority) => {
    const styles: Record<TicketPriority, string> = {
      CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
    return `px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[p]}`;
  };

  const statusBadge = (s: TicketStatus) => {
    const styles: Record<TicketStatus, string> = {
      OPEN: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      IN_PROGRESS: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      ESCALATED: 'bg-rose-600/20 text-rose-400 border-rose-500/40 animate-pulse',
    };
    return `px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[s]}`;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    escalated: tickets.filter((t) => t.status === 'ESCALATED').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">ResolveIT AI</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-medium">
                {user?.role} PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> New Incident
            </button>
            <button
              onClick={logoutUser}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Total Tickets</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-sky-400">Active Queue</p>
            <p className="text-2xl font-bold mt-1 text-sky-400">{stats.open}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> SLA Escalated
            </p>
            <p className="text-2xl font-bold mt-1 text-rose-400">{stats.escalated}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.resolved}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Ticket List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {user?.role === 'ADMIN'
                ? 'All Organization Incidents'
                : user?.role === 'ENGINEER'
                ? 'Assigned to You'
                : 'Your Reported Incidents'}
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
                Loading incidents...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-slate-400 mb-3">No incidents found in this queue.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg"
                >
                  Report First Incident
                </button>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicketDetails(ticket)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-semibold">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ticket.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={priorityBadge(ticket.priority)}>{ticket.priority}</span>
                      <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white text-base mb-1">{ticket.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{ticket.description}</p>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Assigned: <strong className="text-slate-300">{ticket.assignedToName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      SLA: {new Date(ticket.slaDeadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Selected Ticket Details + AI Triage Card + Comments */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-indigo-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h3 className="font-bold text-lg text-white mt-0.5">{selectedTicket.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-slate-300">{selectedTicket.description}</p>

                {selectedTicket.errorLog && (
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-rose-300 overflow-x-auto">
                    {selectedTicket.errorLog}
                  </pre>
                )}

                {/* AI Triage Insights Box */}
                {selectedTicket.aiInsight && (
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> AI Root Cause & Resolution
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <strong>Root Cause:</strong> {selectedTicket.aiInsight.rootCauseSummary}
                    </p>
                    <div className="text-xs text-slate-300 whitespace-pre-line bg-slate-950/60 p-2.5 rounded-lg border border-indigo-500/20">
                      <strong className="text-indigo-300 block mb-1">Recommended Fix:</strong>
                      {selectedTicket.aiInsight.recommendedSteps}
                    </div>
                  </div>
                )}

                {/* Engineer / Admin Controls */}
                {(user?.role === 'ENGINEER' || user?.role === 'ADMIN') && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Update Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="ESCALATED">ESCALATED</option>
                      </select>
                    </div>

                    {user.role === 'ADMIN' && engineers.length > 0 && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Reassign Engineer
                        </label>
                        <select
                          defaultValue=""
                          onChange={(e) => handleReassign(selectedTicket.id, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
                        >
                          <option value="" disabled>
                            Current: {selectedTicket.assignedToName}
                          </option>
                          {engineers.map((eng) => (
                            <option key={eng.id} value={eng.id}>
                              {eng.name} ({eng.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Thread */}
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-3">
                    <MessageSquare className="w-3.5 h-3.5" /> Activity & Comments ({comments.length})
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span className="font-semibold text-slate-200">
                            {c.authorName} ({c.authorRole})
                          </span>
                          <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300">{c.message}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write an update..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                Select any incident card on the left to inspect AI Root Cause Analysis, SLA timer, and comments.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Report New IT Incident
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., VPN Gateway Timeout on Remote Login"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened and its business impact..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Error Log / Stack Trace (Optional — AI analyzes this!)
                </label>
                <textarea
                  rows={3}
                  value={errorLog}
                  onChange={(e) => setErrorLog(e.target.value)}
                  placeholder="Paste stack trace, HTTP error code, or console output..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
                >
                  {submitting ? 'Running AI Triage...' : 'Submit & Run AI Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}