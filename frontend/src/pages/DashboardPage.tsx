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
  Search,
  Copy,
  Check,
  ArrowUpRight,
  Layers,
  Sun,
  Moon,
  Activity,
  ChevronDown,
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

  const [darkMode, setDarkMode] = useState(true);
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [aiExpanded, setAiExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [copiedSteps, setCopiedSteps] = useState(false);

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
    setAiExpanded(true);
    setCopiedSteps(false);
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
      openTicketDetails(res.data);
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

  const handleCopySteps = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSteps(true);
    setTimeout(() => setCopiedSteps(false), 2000);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  const getSlaRemaining = (deadline: string, status: TicketStatus) => {
    if (status === 'RESOLVED') return { text: 'Completed within SLA', color: 'text-emerald-400' };
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'SLA Breached', color: 'text-rose-400 font-semibold' };
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: `${hrs}h ${mins}m left`,
      color: hrs < 1 ? 'text-amber-400 font-medium' : darkMode ? 'text-cyan-300' : 'text-indigo-600',
    };
  };

  const priorityBadge = (p: TicketPriority) => {
    const styles: Record<TicketPriority, string> = {
      CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      MEDIUM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
      LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    };
    return `px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full border ${styles[p]}`;
  };

  const statusBadge = (s: TicketStatus) => {
    const styles: Record<TicketStatus, string> = {
      OPEN: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
      IN_PROGRESS: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      ESCALATED: 'bg-rose-600/25 text-rose-300 border-rose-500/50 animate-pulse',
    };
    return `px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full border ${styles[s]}`;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    escalated: tickets.filter((t) => t.status === 'ESCALATED').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const bgRoot = darkMode
    ? 'bg-[#070b19] text-slate-100 bg-cyber-grid'
    : 'bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/40 text-slate-900';

  const cardSurface = darkMode
    ? 'bg-slate-900/75 backdrop-blur-xl border-slate-800/90'
    : 'bg-white/85 backdrop-blur-xl border-slate-200/90 shadow-sm';

  return (
    <div
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${bgRoot}`}
    >
      {/* Background Cursor Spotlight (BEHIND content at z-0 so text stays 100% sharp) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-200"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${
            darkMode
              ? 'rgba(99, 102, 241, 0.16), rgba(14, 165, 233, 0.08) 45%'
              : 'rgba(99, 102, 241, 0.12), rgba(14, 165, 233, 0.06) 45%'
          }, transparent 75%)`,
        }}
      />

      {/* Animated Floating Aurora Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl animate-float-slow ${
            darkMode ? 'bg-violet-600/15' : 'bg-indigo-400/20'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full blur-3xl animate-float-delayed ${
            darkMode ? 'bg-cyan-500/12' : 'bg-cyan-400/20'
          }`}
        />
      </div>

      {/* Top Glass Navbar */}
      <header
        className={`relative z-20 border-b backdrop-blur-xl sticky top-0 transition-colors duration-300 ${
          darkMode
            ? 'border-slate-800/80 bg-[#080d21]/85'
            : 'border-slate-200/80 bg-white/85'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-110 hover:rotate-3 transition-transform duration-300">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                ResolveIT AI
              </span>
              <span className="ml-2.5 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              AI Engine Online
            </div>

            <div className="text-right hidden sm:block mr-1">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Daylight Glass Mode' : 'Switch to Cyber Aurora Dark Mode'}
              className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:border-amber-400/50'
                  : 'bg-slate-100 border-slate-300 text-indigo-600 hover:border-indigo-400'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="group px-4 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all duration-300 cursor-pointer"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              New Incident
            </button>

            <button
              onClick={logoutUser}
              title="Logout"
              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Interactive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            onMouseMove={handleCardMouseMove}
            onClick={() => setStatusFilter('ALL')}
            className={`group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/15 ${cardSurface}`}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgba(99, 102, 241, 0.22), transparent 75%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400 group-hover:text-indigo-400 transition">
                Total Incidents
              </p>
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-extrabold mt-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {stats.total}
            </p>
          </div>

          <div
            onMouseMove={handleCardMouseMove}
            onClick={() => setStatusFilter('OPEN')}
            className={`group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/15 ${cardSurface}`}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgba(6, 182, 212, 0.22), transparent 75%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs font-medium text-cyan-400">Active Queue</p>
              <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-extrabold mt-2 text-cyan-400">{stats.open}</p>
          </div>

          <div
            onMouseMove={handleCardMouseMove}
            onClick={() => setStatusFilter('ESCALATED')}
            className={`group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-500/15 ${cardSurface}`}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgba(244, 63, 94, 0.22), transparent 75%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs font-medium text-rose-400">SLA Escalated</p>
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-extrabold mt-2 text-rose-400">{stats.escalated}</p>
          </div>

          <div
            onMouseMove={handleCardMouseMove}
            onClick={() => setStatusFilter('RESOLVED')}
            className={`group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/15 ${cardSurface}`}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgba(16, 185, 129, 0.22), transparent 75%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-400">Resolved</p>
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-extrabold mt-2 text-emerald-400">{stats.resolved}</p>
          </div>
        </div>

        {/* Search & Animated Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by RIT-ID, title, or category..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition ${
                darkMode
                  ? 'bg-slate-900/85 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className={`flex flex-wrap gap-1.5 p-1.5 rounded-xl border ${cardSurface}`}>
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.04]'
                    : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Ticket Cards (Spotlight strictly behind crisp text) */}
          <div className="lg:col-span-2 space-y-3.5">
            {loading ? (
              <div className={`p-8 text-center rounded-2xl border ${cardSurface}`}>
                Loading incidents...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border ${cardSurface}`}>
                <p className="text-slate-400 mb-3">No matching incidents found.</p>
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket, index) => {
                const sla = getSlaRemaining(ticket.slaDeadline, ticket.status);
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    onMouseMove={handleCardMouseMove}
                    onClick={() => openTicketDetails(ticket)}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className={`animate-card-in group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-2xl shadow-indigo-500/20 ' +
                          (darkMode ? 'bg-slate-900' : 'bg-white')
                        : `${cardSurface} hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-500/15`
                    }`}
                  >
                    {/* Subtle Under-Layer Spotlight (z-0, text stays crisp at z-10) */}
                    <div
                      className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background:
                          'radial-gradient(350px circle at var(--x, 50%) var(--y, 50%), rgba(99, 102, 241, 0.20), rgba(14, 165, 233, 0.08) 50%, transparent 80%)',
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400">
                            {ticket.ticketNumber}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${
                              darkMode
                                ? 'bg-slate-800/90 text-cyan-300 border-slate-700'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {ticket.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={priorityBadge(ticket.priority)}>{ticket.priority}</span>
                          <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-bold text-base mb-1 transition-colors ${
                            darkMode
                              ? 'text-white group-hover:text-cyan-300'
                              : 'text-slate-900 group-hover:text-indigo-600'
                          }`}
                        >
                          {ticket.title}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200 shrink-0 mt-1" />
                      </div>

                      <p
                        className={`text-xs line-clamp-2 mb-3.5 ${
                          darkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {ticket.description}
                      </p>

                      <div
                        className={`flex flex-wrap items-center justify-between text-xs pt-3 border-t ${
                          darkMode
                            ? 'border-slate-800/80 text-slate-300'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                          Assigned:{' '}
                          <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
                            {ticket.assignedToName}
                          </strong>
                        </span>
                        <span className={`flex items-center gap-1 ${sla.color}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {sla.text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Spring-Animated Resolution Drawer + Collapsible AI Box */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div
                key={selectedTicket.id}
                className={`animate-drawer-in border rounded-2xl p-5 sticky top-24 space-y-5 shadow-2xl ${cardSurface}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h3 className="font-bold text-lg mt-0.5">{selectedTicket.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:rotate-90 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {selectedTicket.description}
                </p>

                {selectedTicket.errorLog && (
                  <pre className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-xs text-rose-300 overflow-x-auto">
                    {selectedTicket.errorLog}
                  </pre>
                )}

                {/* Animated Accordion AI Root Cause Box */}
                {selectedTicket.aiInsight && (
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 via-violet-600/15 to-cyan-500/15 border border-indigo-500/40 overflow-hidden shadow-inner">
                    <div
                      onClick={() => setAiExpanded(!aiExpanded)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 transition"
                    >
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 animate-pulse" /> AI Root Cause & Resolution
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-indigo-300 transition-transform duration-300 ${
                          aiExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        aiExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden px-4 pb-4 space-y-3">
                        <p className="text-xs leading-relaxed">
                          <strong className="text-indigo-400">Root Cause:</strong>{' '}
                          {selectedTicket.aiInsight.rootCauseSummary}
                        </p>

                        <div className="text-xs whitespace-pre-line bg-slate-950/90 text-slate-100 p-3 rounded-xl border border-indigo-500/25 leading-relaxed">
                          <div className="flex items-center justify-between mb-1.5">
                            <strong className="text-cyan-400">Recommended Steps:</strong>
                            <button
                              onClick={() =>
                                handleCopySteps(selectedTicket.aiInsight!.recommendedSteps)
                              }
                              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition cursor-pointer"
                            >
                              {copiedSteps ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          {selectedTicket.aiInsight.recommendedSteps}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engineer / Admin Controls */}
                {(user?.role === 'ENGINEER' || user?.role === 'ADMIN') && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/60">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Update Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)
                        }
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition cursor-pointer ${
                          darkMode
                            ? 'bg-slate-950 border-slate-700 text-white hover:border-indigo-500'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
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
                          className={`w-full px-3 py-2 border rounded-xl text-sm transition cursor-pointer ${
                            darkMode
                              ? 'bg-slate-950 border-slate-700 text-white hover:border-indigo-500'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
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
                <div className="pt-3 border-t border-slate-800/60">
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Activity & Comments ({comments.length})
                  </h4>

                  <div className="space-y-2 max-h-44 overflow-y-auto mb-3 pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No comments yet.</p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            darkMode
                              ? 'bg-slate-950/90 border-slate-800 text-slate-200'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span className="font-semibold text-indigo-400">
                              {c.authorName} ({c.authorRole})
                            </span>
                            <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p>{c.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write an update..."
                      className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition ${
                        darkMode
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className={`border border-dashed rounded-2xl p-8 text-center text-slate-400 text-sm ${cardSurface}`}>
                Select any incident card on the left to inspect AI Root Cause Analysis, SLA countdown, and comments.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="animate-drawer-in bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-indigo-500/20 text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Report New IT Incident
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition"
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-mono focus:outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
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