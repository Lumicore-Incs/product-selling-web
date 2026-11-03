import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Upload, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { read, utils, type WorkBook } from 'xlsx';
import { getCurrentUser } from '../service/auth';
import leadService, { type LeadApiItem, type LeadRequestPayload } from '../services/leads/leadService';
import { userService } from '../services/users/userService';

const LEAD_STATUSES = [
  'New',
  'Not Answer',
  'Wrong Number',
  'Conformed',
  'Not Interested',
] as const;

const REQUIRED_COLUMNS = [
  'full_name',
  'phone_number',
] as const;

const LEAD_COLUMNS = [
  ...REQUIRED_COLUMNS,
  'phone_number2',
  'street_address',
  'type',
] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number];

interface Lead {
  id: string;
  backendId?: string | null;
  full_name: string;
  phone_number: string;
  phone_number2: string;
  street_address: string;
  type: string;
  assignedUserId: string | null;
  status: LeadStatus;
}

interface LeadUser {
  id: string;
  name: string;
  leadCount?: number;
}

interface CurrentUser {
  id: string;
  role: string;
}

const normalizeHeader = (header: string) =>
  header.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeRole = (role: string) =>
  role.toUpperCase().replace(/[_-]+/g, ' ').trim();

const isManagerRole = (role: string) =>
  ['ADMIN', 'SUPER USER', 'SUPERUSER'].includes(normalizeRole(role));

const normalizeLeadStatus = (status?: string): LeadStatus =>
  LEAD_STATUSES.find(
    (knownStatus) => knownStatus.toLowerCase() === status?.trim().toLowerCase(),
  ) ?? 'New';

const getLeadId = () =>
  `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const statusBadgeClass = (status: LeadStatus) =>
  ({
    New: 'bg-blue-50 text-blue-700',
    'Not Answer': 'bg-amber-50 text-amber-700',
    'Wrong Number': 'bg-red-50 text-red-700',
    Conformed: 'bg-green-50 text-green-700',
    'Not Interested': 'bg-gray-100 text-gray-600',
  })[status];

export const LeadsSetup = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<LeadUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string>>({});
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [assignmentQty, setAssignmentQty] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('New');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canManageLeads = isManagerRole(currentUser?.role ?? '');

  const pendingLeads = useMemo(
    () => leads.filter((lead) => !lead.assignedUserId && !draftAssignments[lead.id]),
    [draftAssignments, leads],
  );

  const visibleLeads = useMemo(
    () =>
      canManageLeads
        ? leads.filter((lead) => !lead.assignedUserId && !draftAssignments[lead.id])
        : leads.filter((lead) => lead.assignedUserId === currentUser?.id),
    [canManageLeads, currentUser?.id, draftAssignments, leads],
  );

  const filteredVisibleLeads = useMemo(
    () =>
      statusFilter === 'All'
        ? visibleLeads
        : visibleLeads.filter((lead) => lead.status === statusFilter),
    [statusFilter, visibleLeads],
  );

  const mapApiLeadToLocal = useCallback((lead: LeadApiItem): Lead => ({
    id: String(lead.id ?? getLeadId()),
    backendId: lead.id != null ? String(lead.id) : null,
    full_name: String(lead.name ?? lead.fullName ?? ''),
    phone_number: String(lead.contact01 ?? ''),
    phone_number2: String(lead.contact02 ?? ''),
    street_address: String(lead.address ?? ''),
    type: String(lead.type ?? ''),
    assignedUserId: lead.userId != null ? String(lead.userId) : null,
    status: normalizeLeadStatus(lead.status),
  }), []);

  const loadLeadCounts = useCallback(async (role: string) => {
    if (!isManagerRole(role)) return;

    try {
      const counts = await leadService.getLeadQty();
      const countMap = new Map<string, number>();

      counts.forEach((entry) => {
        const key = String(entry.userId ?? entry.id ?? '');
        const value = Number(entry.qty ?? entry.quantity ?? entry.count ?? 0);
        if (key) {
          countMap.set(key, Number.isFinite(value) ? value : 0);
        }
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => ({
          ...user,
          leadCount: countMap.get(user.id) ?? 0,
        })),
      );
    } catch (loadError) {
      console.error('Failed to load lead counts:', loadError);
    }
  }, []);

  const loadAssignedLeads = useCallback(async (userId: string) => {
    try {
      const leadRows = await leadService.getLeadsByUser(userId);
      const mappedLeads = leadRows.map(mapApiLeadToLocal);
      setLeads((existing) => {
        const next = [...existing];
        mappedLeads.forEach((mappedLead) => {
          const idx = next.findIndex((lead) => lead.id === mappedLead.id);
          if (idx >= 0) next[idx] = mappedLead;
          else next.push(mappedLead);
        });
        return next;
      });
    } catch (loadError) {
      console.error('Failed to load leads for user:', loadError);
    }
  }, [mapApiLeadToLocal]);

  useEffect(() => {
    let active = true;

    const loadPageData = async () => {
      try {
        localStorage.removeItem('leadsSetup.leads');
        const user = await getCurrentUser();

        if (!active) return;

        const signedInUser: CurrentUser = {
          id: String(user.id),
          role: normalizeRole(String(user.role ?? '')),
        };

        setCurrentUser(signedInUser);

        const allUsers = await userService.getAllUsers();
        if (!active) return;

        const filteredUsers = allUsers
          .filter((item) => !isManagerRole(String(item.role ?? '')))
          .map((item) => ({
            id: String(item.id),
            name: String(item.name ?? 'Unnamed User'),
          }));

        setUsers(filteredUsers);

        if (isManagerRole(signedInUser.role)) {
          await loadLeadCounts(signedInUser.role);
          await Promise.all(filteredUsers.map((item) => loadAssignedLeads(item.id)));
        } else {
          await loadAssignedLeads(signedInUser.id);
        }
      } catch (loadError) {
        console.error('Failed to load phone_number2:', loadError);

        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load lead data. Please refresh and try again.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPageData();

    return () => {
      active = false;
    };
  }, [loadAssignedLeads, loadLeadCounts]);

  // Import CSV, XLS, XLSX, including Meta/Facebook UTF-16 TSV exports.
  const handleLeadFileImport = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again.
    event.target.value = '';

    if (!file) return;

    setImporting(true);
    setError('');
    setNotice('');

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const isUtf16 =
        (bytes[0] === 0xff && bytes[1] === 0xfe) ||
        (bytes[0] === 0xfe && bytes[1] === 0xff);

      let workbook: WorkBook;

      if (isUtf16) {
        // Decode UTF-16 files exported by Meta/Facebook.
        const text = new TextDecoder('utf-16').decode(buffer);

        // Detect whether the exported text uses tabs or commas.
        const firstLine = text.split(/\r?\n/).find((line) => line.trim());

        const separator =
          firstLine && firstLine.split('\t').length > firstLine.split(',').length
            ? '\t'
            : ',';

        workbook = read(text, {
          type: 'string',
          FS: separator,
        });
      } else {
        // Read Excel files directly.
        const isExcelFile = /\.(xlsx|xls)$/i.test(file.name);

        if (isExcelFile) {
          workbook = read(buffer, { type: 'array' });
        } else {
          // Decode UTF-8 CSV, with a UTF-8 BOM handled by TextDecoder.
          const text = new TextDecoder('utf-8').decode(buffer);
          const firstLine = text.split(/\r?\n/).find((line) => line.trim());

          const separator =
            firstLine && firstLine.split('\t').length > firstLine.split(',').length
              ? '\t'
              : ',';

          workbook = read(text, {
            type: 'string',
            FS: separator,
          });
        }
      }

      if (workbook.SheetNames.length === 0) {
        throw new Error('The selected file has no worksheet.');
      }

      let foundRows: unknown[][] | undefined;
      let headerIndex = -1;
      let columnIndexes: number[] = [];

      // Find the required headers in any worksheet.
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) continue;

        const rows = utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        const matchedIndex = rows.findIndex((row) => {
          const headers = row.map((cell) =>
            normalizeHeader(String(cell ?? '')),
          );

          return REQUIRED_COLUMNS.every((column) =>
            headers.includes(normalizeHeader(column)),
          );
        });

        if (matchedIndex >= 0) {
          foundRows = rows;
          headerIndex = matchedIndex;

          const normalizedHeaders = rows[matchedIndex].map((cell) =>
            normalizeHeader(String(cell ?? '')),
          );

          columnIndexes = LEAD_COLUMNS.map((column) =>
            normalizedHeaders.indexOf(normalizeHeader(column)),
          );

          break;
        }
      }

      if (!foundRows || headerIndex < 0) {
        throw new Error(
          `File must contain these columns: ${REQUIRED_COLUMNS.join(', ')}.`,
        );
      }

      const importedLeads: Lead[] = foundRows
        .slice(headerIndex + 1)
        .filter((row) =>
          row.some((value) => String(value ?? '').trim() !== ''),
        )
        .map((row) => {
          const values = columnIndexes.map((index) =>
            String(row[index] ?? '').trim(),
          );

          return {
            id: getLeadId(),
            full_name: values[0],
            phone_number: values[1].replace(/^p:/i, ''),
            phone_number2: values[2],
            street_address: values[3],
            type: values[4],
            assignedUserId: null,
            status: 'New',
          };
        });

      if (importedLeads.length === 0) {
        throw new Error('The selected file contains no lead rows.');
      }

      setLeads((existing) => [...existing, ...importedLeads]);

      setNotice(`${importedLeads.length} leads imported successfully.`);
    } catch (importError) {
      console.error('Failed to import leads file:', importError);

      setError(
        importError instanceof Error
          ? importError.message
          : 'Failed to read the selected file.',
      );
    } finally {
      setImporting(false);
    }
  };

  // Prepare an assignment draft; confirmation is separate so it can be persisted by the API later.
  const assignLeads = () => {
    setError('');
    setNotice('');

    const entered = users.map((user) => ({
      user,
      quantity: Number(assignmentQty[user.id] || 0),
    }));

    if (
      entered.some(
        ({ quantity }) =>
          !Number.isInteger(quantity) || quantity < 0,
      )
    ) {
      setError('Enter a non-negative whole-number quantity for each user.');
      return;
    }

    const assignments = entered.filter(({ quantity }) => quantity > 0);

    const requestedTotal = assignments.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    if (requestedTotal === 0) {
      setError('Enter a quantity for at least one user.');
      return;
    }

    const assignmentCandidates = selectedLeadIds.size > 0
      ? pendingLeads.filter((lead) => selectedLeadIds.has(lead.id))
      : pendingLeads;

    if (requestedTotal > assignmentCandidates.length) {
      setError(
        selectedLeadIds.size > 0
          ? `You requested ${requestedTotal} leads, but only ${assignmentCandidates.length} rows are selected.`
          : `You requested ${requestedTotal} leads, but only ${pendingLeads.length} are unassigned.`,
      );
      return;
    }

    const assignmentByLeadId: Record<string, string> = {};
    let leadIndex = 0;

    assignments.forEach(({ user, quantity }) => {
      for (let count = 0; count < quantity; count += 1) {
        assignmentByLeadId[assignmentCandidates[leadIndex].id] = user.id;
        leadIndex += 1;
      }
    });

    setDraftAssignments((existing) => ({ ...existing, ...assignmentByLeadId }));
    setSelectedLeadIds(new Set());
    setAssignmentQty({});
    setError('');
    setNotice(`${requestedTotal} leads ready to confirm.`);
  };

  const confirmAssignments = async () => {
    const assignments = Object.entries(draftAssignments);
    if (assignments.length === 0) return;

    setError('');
    setNotice('');

    try {
      const payload: LeadRequestPayload[] = assignments.map(([leadId, userId]) => {
        const lead = leads.find((item) => item.id === leadId);

        return {
          date: new Date().toISOString(),
          name: lead?.full_name ?? 'Unnamed lead',
          contact01: lead?.phone_number ?? '',
          contact02: '',
          address: lead ? `${lead.street_address ?? ''} ${lead.phone_number2 ?? ''}`.trim() : '',
          type: lead?.type ?? 'Lead',
          status: lead?.status ?? 'New',
          userId: Number(userId),
        };
      });

      const saved = await leadService.saveLeads(payload);
      const savedById = new Map<string, string>();
      saved.forEach((item) => {
        if (item.id != null) savedById.set(String(item.id), String(item.userId ?? ''));
      });

      setLeads((existing) =>
        existing.map((lead) => {
          const matching = assignments.find(([leadKey]) => leadKey === lead.id);
          if (!matching) return lead;
          const assignedUserId = matching[1];
          const backendMatch = lead.backendId ? savedById.get(lead.backendId) : undefined;
          return assignedUserId || backendMatch
            ? {
                ...lead,
                assignedUserId,
                backendId: backendMatch ?? lead.backendId,
              }
            : lead;
        }),
      );

      setDraftAssignments({});
      setNotice(`${assignments.length} leads saved and assigned successfully.`);
      if (currentUser && isManagerRole(currentUser.role)) {
        await loadLeadCounts(currentUser.role);
      }
    } catch (saveError) {
      console.error('Failed to save assignments:', saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save assignments. Please try again.',
      );
    }
  };

  // Update lead status.
  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    if (!lead.backendId) {
      setError('This lead cannot be updated because it has no backend record.');
      return;
    }

    try {
      const updatedLead = await leadService.updateLeadStatus(lead.backendId, status);
      setLeads((existing) =>
        existing.map((item) =>
          item.id === leadId ? { ...item, status } : item,
        ),
      );

      if (status === 'Conformed') {
        navigate('/sale', {
          state: {
            leadPrefill: {
              name: updatedLead.name ?? updatedLead.fullName ?? lead.full_name,
              contact01: updatedLead.contact01 ?? lead.phone_number,
              contact02: updatedLead.contact02 ?? lead.phone_number2,
              address: updatedLead.address ?? lead.street_address,
            },
          },
        });
        return;
      }

      setNotice('Lead status updated successfully.');
    } catch (updateError) {
      console.error('Failed to update lead status:', updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update lead status. Please try again.',
      );
    }
  };

  const countForUser = (userId: string) =>
    leads.filter((lead) => lead.assignedUserId === userId).length;

  const getLeadStatusValue = (lead: Lead) => {
    if (lead.status) return lead.status;
    return 'New';
  };

  const allVisibleLeadsSelected =
    filteredVisibleLeads.length > 0 &&
    filteredVisibleLeads.every((lead) => selectedLeadIds.has(lead.id));

  const toggleVisibleLeadSelection = (checked: boolean) => {
    setSelectedLeadIds((current) => {
      const next = new Set(current);
      filteredVisibleLeads.forEach((lead) => {
        if (checked && !lead.assignedUserId && !draftAssignments[lead.id]) {
          next.add(lead.id);
        } else {
          next.delete(lead.id);
        }
      });
      return next;
    });
  };

  const toggleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedLeadIds((current) => {
      const next = new Set(current);
      if (checked) next.add(leadId);
      else next.delete(leadId);
      return next;
    });
  };

  if (loading) {
    return (
      <p className="py-12 text-center text-gray-600">
        Loading phone_number2…
      </p>
    );
  }

  // Total columns in the table: [checkbox] + # + 6 data columns
  const totalColumns = canManageLeads ? 8 : 7;

  const emptyMessage = canManageLeads
    ? 'No leads yet. Import a CSV or Excel file to get started.'
    : statusFilter === 'All'
      ? 'No leads have been assigned to your account.'
      : `No leads found with status "${statusFilter}".`;

  return (
    <div
      className="min-h-screen relative px-3 py-4 sm:px-0 sm:py-0"
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-[44px] h-[44px] sm:w-[53px] sm:h-[53px] shrink-0 flex items-center justify-center rounded-lg bg-[#0B818D]">
            <FileSpreadsheet size={27} className="text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[#0E626E] sm:text-[28px] sm:leading-[35px]">
              phone_number2
            </h1>

            <p className="text-xs text-gray-600 mt-0.5">
              Import leads, assign users, and track lead status.
            </p>
          </div>
        </div>

        {/* Error and success messages */}
        {error && (
          <p
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {notice}
          </p>
        )}

        {canManageLeads && (
          <>
            {/* Lead counts by user */}
            <section className="rounded-xl border border-white/70 bg-white/70 p-4 sm:p-5 shadow-sm mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">
                Lead counts by user
              </h2>

              {users.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No assignable users found.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/80 p-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Users
                          size={17}
                          className="shrink-0 text-[#0B818D]"
                        />

                        <span className="truncate font-medium text-gray-800">
                          {user.name}
                        </span>
                      </div>

                      <span className="rounded-full bg-[#0B818D]/10 px-3 py-1 text-sm font-bold text-[#0B818D]">
                        {user.leadCount ?? countForUser(user.id)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Import leads */}
            <section className="rounded-xl border border-white/70 bg-white/70 p-4 sm:p-5 shadow-sm mb-6">
              <h2 className="font-semibold text-gray-800 mb-2">
                Import leads from CSV or Excel
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Required columns: {REQUIRED_COLUMNS.join(', ')}. Optional columns:{' '}
                {LEAD_COLUMNS.slice(REQUIRED_COLUMNS.length).join(', ')}.
              </p>

              <label className="flex w-full sm:inline-flex sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0B818D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#096d77]">
                <Upload size={17} />

                {importing ? 'Reading file…' : 'Choose CSV or Excel file'}

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => {
                    setSelectedFileName(event.target.files?.[0]?.name ?? '');
                    void handleLeadFileImport(event);
                  }}
                  disabled={importing}
                  className="sr-only"
                />
              </label>
              {selectedFileName && (
                <p className="mt-3 break-all text-sm text-gray-600" aria-live="polite">
                  Selected file: {selectedFileName}
                </p>
              )}
              {leads.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {leads.length} rows loaded into the table.
                </p>
              )}
            </section>

            {/* Assign unassigned leads */}
            <section className="rounded-xl border border-white/70 bg-white/70 p-4 sm:p-5 shadow-sm mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">
                    Assign unassigned leads
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {pendingLeads.length} available
                  </p>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={assignLeads}
                    disabled={pendingLeads.length === 0 || users.length === 0}
                    className="flex-1 sm:flex-none rounded-lg bg-[#0B818D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#096d77] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Assign leads
                  </button>
                  <button
                    type="button"
                    onClick={confirmAssignments}
                    disabled={Object.keys(draftAssignments).length === 0}
                    className="flex-1 sm:flex-none rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirm ({Object.keys(draftAssignments).length})
                  </button>
                </div>
              </div>

              {users.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {user.name} — {user.leadCount ?? countForUser(user.id)} assigned
                      {Object.values(draftAssignments).filter((id) => id === user.id).length > 0
                        ? ` + ${Object.values(draftAssignments).filter((id) => id === user.id).length} pending`
                        : ''}

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={assignmentQty[user.id] ?? ''}
                        onChange={(event) =>
                          setAssignmentQty((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                        placeholder="Quantity to assign"
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 shadow-sm focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Leads: cards on mobile, table on desktop */}
        <section className="overflow-hidden rounded-xl border border-white/70 bg-white/70 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="font-semibold text-gray-800">Leads</h2>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as LeadStatus | 'All')
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                  aria-label="Filter leads by status"
                >
                  <option value="New">New</option>
                  {LEAD_STATUSES.filter((status) => status !== 'New').map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                  <option value="All">All statuses</option>
                </select>
              </label>
              <span className="rounded-full bg-[#0B818D]/10 px-3 py-1 text-sm font-bold text-[#0B818D]">
                Total: {filteredVisibleLeads.length}
              </span>
            </div>
          </div>

          {/* ===== MOBILE: cards ===== */}
          <div className="md:hidden">
            {canManageLeads && filteredVisibleLeads.length > 0 && (
              <label className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={allVisibleLeadsSelected}
                  onChange={(event) => toggleVisibleLeadSelection(event.target.checked)}
                  className="h-4 w-4 accent-[#0B818D]"
                />
                Select all
                {selectedLeadIds.size > 0 && (
                  <span className="ml-auto text-xs text-gray-500">
                    {selectedLeadIds.size} selected
                  </span>
                )}
              </label>
            )}

            {filteredVisibleLeads.length > 0 ? (
              <ul className="space-y-3 p-3">
                {filteredVisibleLeads.map((lead, index) => (
                  <li
                    key={lead.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {canManageLeads && (
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={(event) =>
                            toggleLeadSelection(lead.id, event.target.checked)
                          }
                          aria-label={`Select lead ${lead.full_name || lead.id}`}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#0B818D]"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-400">
                          #{index + 1}
                        </p>
                        <p className="truncate text-base font-semibold text-gray-900">
                          {lead.full_name || '-'}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="break-words font-medium text-gray-800">
                        {lead.phone_number ? (
                          <a
                            href={`tel:${lead.phone_number}`}
                            className="text-[#0B818D]"
                          >
                            {lead.phone_number}
                          </a>
                        ) : (
                          '-'
                        )}
                      </dd>

                      <dt className="text-gray-500">Phone 2</dt>
                      <dd className="break-words text-gray-800">
                        {lead.phone_number2 ? (
                          <a
                            href={`tel:${lead.phone_number2}`}
                            className="text-[#0B818D]"
                          >
                            {lead.phone_number2}
                          </a>
                        ) : (
                          '-'
                        )}
                      </dd>

                      <dt className="text-gray-500">Address</dt>
                      <dd className="break-words text-gray-800">
                        {lead.street_address || '-'}
                      </dd>

                      <dt className="text-gray-500">Type</dt>
                      <dd className="break-words text-gray-800">
                        {lead.type || '-'}
                      </dd>
                    </dl>

                    {!canManageLeads && (
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <label className="block text-xs font-medium text-gray-500">
                          Update status
                          <select
                            value={getLeadStatusValue(lead)}
                            onChange={(event) =>
                              void updateLeadStatus(
                                lead.id,
                                event.target.value as LeadStatus,
                              )
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                            aria-label={`Status for ${lead.full_name || 'lead'}`}
                          >
                            {LEAD_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-gray-500">
                {emptyMessage}
              </p>
            )}

            <div className="border-t border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
              Total leads: {filteredVisibleLeads.length}
              {statusFilter !== 'All' && (
                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                  {statusFilter} only · {visibleLeads.length} in all statuses
                </span>
              )}
            </div>
          </div>

          {/* ===== DESKTOP: table ===== */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  {canManageLeads && (
                    <th scope="col" className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleLeadsSelected}
                        onChange={(event) => toggleVisibleLeadSelection(event.target.checked)}
                        aria-label="Select all visible unassigned leads"
                        className="h-4 w-4 accent-[#0B818D]"
                      />
                    </th>
                  )}
                  <th scope="col" className="w-14 px-4 py-3 font-semibold">
                    #
                  </th>
                  {[
                    'Full Name',
                    'Phone Number',
                    'Phone Number 2',
                    'Street Address',
                    'Type',
                    'Status',
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-gray-700">
                {filteredVisibleLeads.length > 0 ? (
                  filteredVisibleLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-white/70">
                      {canManageLeads && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.has(lead.id)}
                            onChange={(event) =>
                              toggleLeadSelection(lead.id, event.target.checked)
                            }
                            aria-label={`Select lead ${lead.full_name || lead.id}`}
                            className="h-4 w-4 accent-[#0B818D]"
                          />
                        </td>
                      )}

                      <td className="px-4 py-3 font-medium text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                        {lead.full_name || '-'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {lead.phone_number || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {lead.phone_number2 || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {lead.street_address || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {lead.type || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {canManageLeads ? (
                          <span>{lead.status}</span>
                        ) : (
                          <select
                            value={getLeadStatusValue(lead)}
                            onChange={(event) =>
                              void updateLeadStatus(
                                lead.id,
                                event.target.value as LeadStatus,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                            aria-label={`Status for ${lead.full_name || 'lead'}`}
                          >
                            {LEAD_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={totalColumns}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Total count footer */}
              <tfoot className="border-t border-gray-300 bg-gray-50 text-sm font-semibold text-gray-800">
                <tr>
                  <td colSpan={totalColumns} className="px-4 py-3">
                    Total leads: {filteredVisibleLeads.length}
                    {statusFilter !== 'All' && (
                      <span className="ml-2 font-normal text-gray-500">
                        ({statusFilter} only · {visibleLeads.length} in all statuses)
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <p className="mt-4 text-xs text-gray-500">
          Assignment confirmation is persisted to the backend and refreshes the visible lead counts after each save.
        </p>
      </div>
    </div>
  );
};