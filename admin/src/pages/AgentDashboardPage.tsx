import { useState, useMemo, useEffect} from "react"
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import {
  ChevronLeft, ChevronRight, Phone, Target, Clock, TrendingUp, Loader2,
  AlertTriangle, Wifi, Repeat, UploadCloud, FileSpreadsheet, CheckCircle2, Search, Filter,
  Calendar, Download, Plus
} from "lucide-react"

import AppNavbar from "@/components/AppNavbar.tsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "sonner"
import * as XLSX from "xlsx" // NEW: SheetJS import for Excel parsing

import { apiFetch } from "@/lib/api.tsx"
import { useAuth } from "@/contexts/AuthContext.tsx"
import { clientsApi } from "@/lib/clients-api.ts"

// --- PALETTES & UTILS ---
const chartPalette = { dial: "#0077BE", connect: "#0D9488", interest: "#F59E0B", convert: "#4F46E5", miss: "#FB7185", neutral: "#94A3B8", emerald: "#10B981" }

const statusPalette = {
  dial: "#7B00BEFF",
  closed: "#0077BE",
  answered: "#0D9488",
  busy: "#F59E0B",
  not_interested: "#000000",
  failed: "#FB7185",
  no_answer: "#94A3B8",
  callback: "#10B981"
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const heatmapHours = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"]
const systemFields = ["Client Name", "Status", "Project", "Attempts", "Next Dial"] // Phone is handled dynamically

const letterToIndex = (letters: string) => {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

const getStatusColor = (status: string) => {
  if (!status) return chartPalette.neutral;
  const formatted = status.toLowerCase().replace(" ", "_") as keyof typeof statusPalette;
  if (statusPalette[formatted]) return statusPalette[formatted];
  let hash = 0;
  for (let i = 0; i < formatted.length; i++) hash = formatted.charCodeAt(i) + ((hash << 5) - hash);
  return `#${(hash & 0x00FFFFFF).toString(16).padStart(6, '0')}`;
}

export default function AgentDashboardPage() {
  // --- AUTH CONTEXT ---
  const { user } = useAuth()
  const id = user?.id

  // --- ANALYTICS STATE ---
  const [Agent, setAgent] = useState<any>({})
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [followUps, setFollowUps] = useState<any[]>([])
  const [heatmapDays, setHeatmapDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array.from({ length: 7 }, () => Array(10).fill(0)))

  // --- CALL RECORDS TABLE STATE ---
  const [callRecords, setCallRecords] = useState<any[]>([])
  const [ownerDetails, setOwnerDetails] = useState<Record<string, {name: string, phone: string}>>({})
  const [projectDetails, setProjectDetails] = useState<Record<string, string>>({})
  const [dateRange, setDateRange] = useState("Today")
  const [date, setDate] = useState("")
  const [callSearchTerm, setCallSearchTerm] = useState("")
  const [callCurrentPage, setCallCurrentPage] = useState(1)
  const [callTotalPages, setCallTotalPages] = useState(1)
  const [callTotalRecords, setCallTotalRecords] = useState(0)

  // --- CLIENTS PIPELINE TABLE STATE (SERVER-SIDE) ---
  const [clients, setClients] = useState<any[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientStatusFilter, setClientStatusFilter] = useState("All")
  const [clientCurrentPage, setClientCurrentPage] = useState(1)
  const [clientTotalPages, setClientTotalPages] = useState(1)
  const [clientTotalRecords, setClientTotalRecords] = useState(0)
  const ITEMS_PER_PAGE = 10

  // --- CSV / EXCEL UPLOAD STATE ---
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<1 | 2>(1)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [startRow, setStartRow] = useState<number>(2)
  const [endRow, setEndRow] = useState<string>("")
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [phoneFields, setPhoneFields] = useState<string[]>(["Primary Phone"])
  const [excelHeaders, setExcelHeaders] = useState<{ label: string; letter: string }[]>([])

  // --- MOUNT EFFECTS ---
  useEffect(() => {
    if (!id) return;
    loadAgentData()
    loadWeeklyAvgDuration()
    loadFollowUps()
    loadCallingWindows()
  }, [id])

  useEffect(() => {
    if (!id) return;
    loadCallRecords()
  }, [id, callCurrentPage, dateRange, date])

  // --- SERVER-SIDE CLIENTS TABLE TRIGGER ---
  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      loadClients()
    }, 400)
    return () => clearTimeout(timer)
  }, [id, clientCurrentPage, clientStatusFilter, clientSearchTerm])

  useEffect(() => {
    const fetchMissingDetails = async () => {
      const uniqueOwnerIds = callRecords.map(r => r.owner_id).filter((id, index, arr) => id && arr.indexOf(id) === index);
      const uniqueProjectIds = callRecords.map(r => r.project_id).filter((id, index, arr) => id && arr.indexOf(id) === index);

      const missingOwners = uniqueOwnerIds.filter(id => !ownerDetails[id]);
      const missingProjects = uniqueProjectIds.filter(id => !projectDetails[id]);

      if (missingOwners.length > 0) {
        const ownerPromises = missingOwners.map(id => apiFetch(`owners/${id}`, { method: 'GET' }).then(res => res.ok ? res.json() : null));
        const ownersData = await Promise.all(ownerPromises);

        const newOwnerDetails = { ...ownerDetails };
        ownersData.forEach(data => {
          if (data && data.id) {
            newOwnerDetails[data.id] = { name: data.name || `Owner #${data.id}`, phone: data.phones?.[0]?.phone || "N/A" };
          }
        });
        setOwnerDetails(newOwnerDetails);
      }

      if (missingProjects.length > 0) {
        const projectPromises = missingProjects.map(id => apiFetch(`projects/${id}`, { method: 'GET' }).then(res => res.ok ? res.json() : null));
        const projectsData = await Promise.all(projectPromises);

        const newProjectDetails = { ...projectDetails };
        projectsData.forEach(data => {
          if (data && data.id) {
            newProjectDetails[data.id] = data.name || `Project #${data.id}`;
          }
        });
        setProjectDetails(newProjectDetails);
      }
    };

    if (callRecords.length > 0) fetchMissingDetails();
  }, [callRecords])

  // --- ANALYTICS COMPUTATIONS ---
  const totalCallsDashboard = Agent?.stats?.total_calls || 0;
  const answeredCalls = Agent?.stats?.answered || 0;
  const closedCalls = Agent?.stats?.closed || 0;
  const successRate = totalCallsDashboard > 0 ? Math.round((closedCalls / totalCallsDashboard) * 100) : 0;
  const realConnectRate = totalCallsDashboard > 0 ? Math.round((answeredCalls / totalCallsDashboard) * 100) : 0;

  const today = new Date();
  today.setHours(0,0,0,0);
  const overdueCount = followUps.filter(f => new Date(f.nextDial) < today).length
  const avgAttemptsToClose = closedCalls > 0 ? (totalCallsDashboard / closedCalls).toFixed(1) : "0.0";

  const heatmapMax = useMemo(() => {
    const flat = heatmapData.flat();
    const maxVal = Math.max(...flat);
    return maxVal > 0 ? maxVal : 1;
  }, [heatmapData]);

  const funnelData = [
    { stage: "Dialed", value: totalCallsDashboard, color: statusPalette.dial },
    { stage: "Answered", value: answeredCalls, color: statusPalette.answered },
    { stage: "Callback", value: Agent?.stats?.callback || 0, color: statusPalette.callback },
    { stage: "Closed", value: closedCalls, color: statusPalette.closed },
  ]

  // --- CALL RECORDS FRONTEND FILTERING ---
  const displayRecords = callRecords.filter(log => {
    if (!callSearchTerm) return true;
    const term = callSearchTerm.toLowerCase();
    const ownerInfo = ownerDetails[log.owner_id] || { name: "", phone: "" };
    const projectName = projectDetails[log.project_id] || "";
    return String(log.owner_id).includes(term) ||
           (log.agent_notes || "").toLowerCase().includes(term) ||
           ownerInfo.name.toLowerCase().includes(term) ||
           ownerInfo.phone.toLowerCase().includes(term) ||
           projectName.toLowerCase().includes(term);
  });

  const handleCallDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDate(e.target.value)
      setDateRange(e.target.value)
      setCallCurrentPage(1)
    }
  }

  const handleCallPresetDateChange = (range: string) => {
    setDateRange(range)
    setDate("")
    setCallCurrentPage(1)
  }

  // --- COMPLETE API LOGIC ---
  const getOverallDateRange = () => {
    return { from: new Date("2020-01-01").toISOString(), to: new Date().toISOString() };
  };

  const loadAgentData = async () => {
    try {
      if (!id) return;
      const profileResponse = await apiFetch(`users/${id}`, { method: "GET" })
      if (!profileResponse.ok) throw new Error("Failed to load agent profile")
      const profileData = await profileResponse.json()

      const { from, to } = getOverallDateRange();
      const statsResponse = await apiFetch(`users/${id}/stats?from=${from}&to=${to}`, { method: "GET" })
      if (!statsResponse.ok) throw new Error("Failed to load agent stats")
      const statsData = await statsResponse.json()

      const preCombinedData = { ...profileData, stats: statsData }

      let now = new Date();
      let start = new Date(now);
      start.setHours(0, 0, 0, 0)
      const workHoursResponse = await apiFetch(`users/${id}/stats?from=${start.toISOString()}&to=${now.toISOString()}`, { method: "GET" })
      if(!workHoursResponse.ok) throw new Error("Failed to load agent workHours")
      const workHours = await workHoursResponse.json()

      const combinedData = { ...preCombinedData, workHoursToday: workHours.total_session_time_seconds / 3600 }

      const keys = ["avg_duration_seconds", "total_calls", "total_session_time_seconds"]
      const copy = { ...statsData }
      keys.forEach((key) => delete copy[key])

      let formattedCallsArray = Object.entries(copy)
        .filter(([_, countValue]) => Number(countValue) > 0)
        .map(([statusKey, countValue]) => ({
          name: statusKey,
          value: Number(countValue),
          color: getStatusColor(statusKey)
      }))

      if (formattedCallsArray.length === 0) {
        formattedCallsArray = [{ name: "no_data_yet", value: 1, color: "#f1f5f9" }]
      }
      setCalls(formattedCallsArray)
      setAgent(combinedData)
    } catch(error: any) {
      toast.error(error.message)
    }
  }

  const loadWeeklyAvgDuration = async () => {
    try {
      if (!id) return;
      const weekRanges = Array.from({ length: 7 }).map((_, index) => {
        const daysAgo = 6 - index;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAgo);

        const fromDate = new Date(targetDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(targetDate);
        toDate.setHours(23, 59, 59, 999);

        return { dayLabel: targetDate.toLocaleDateString('en-US', { weekday: 'short' }), from: fromDate.toISOString(), to: toDate.toISOString() };
      });

      const weeklyData = await Promise.all(
        weekRanges.map(async (range) => {
          const localizedDate = range.to.split('T')[0]
          try {
            const response = await apiFetch(`users/${id}/stats?from=${range.from}&to=${range.to}`, { method: "GET" });
            if (!response.ok) return { day: localizedDate, avgDuration: 0 };
            const data = await response.json();
            return { day: localizedDate, avgDuration: data.avg_duration_seconds || 0 };
          } catch (err) {
            return { day: localizedDate, avgDuration: 0 };
          }
        })
      );
      setWeeklyChartData(weeklyData)
    } catch(error: any) {
      console.error(error)
    }
  }

  const loadClients = async () => {
    try {
      let url = `owners?agent_id=${id}&page=${clientCurrentPage}&limit=${ITEMS_PER_PAGE}`;
      if (clientStatusFilter !== "All") url += `&status=${encodeURIComponent(clientStatusFilter)}`;
      if (clientSearchTerm.trim() !== "") url += `&search=${encodeURIComponent(clientSearchTerm)}`;

      const response = await apiFetch(url, { method: "GET" })
      if(!response.ok) {
        setClients([]); setClientTotalPages(1); setClientTotalRecords(0); return;
      }
      const jsonResponse = await response.json();

      setClients(jsonResponse.data || [])
      const total = jsonResponse.meta?.total || 0;
      setClientTotalRecords(total)
      setClientTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1)
    } catch(error: any) {
      setClients([])
      toast.error("Failed to load your pipeline")
    }
  }

  const loadCallRecords = async () => {
    const now = new Date();
    let fromDate = new Date(now);
    let toDate = new Date(now);

    if (date) {
      fromDate = new Date(date);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);
    } else if (dateRange === "Today") {
      fromDate.setHours(0, 0, 0, 0);
    } else if (dateRange === "Past Week") {
      fromDate.setDate(now.getDate() - 7);
    } else if (dateRange === "Past Month") {
      fromDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === "Past Year") {
      fromDate.setFullYear(now.getFullYear() - 1);
    }

    try {
      const response = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10&page=${callCurrentPage}`, { method: "GET" })
      if (!response.ok) {
        setCallRecords([]); setCallTotalPages(1); setCallTotalRecords(0); return;
      }
      const jsonResponse = await response.json();
      if (jsonResponse && Array.isArray(jsonResponse.data)) {
         setCallRecords(jsonResponse.data)
         const total = jsonResponse.meta?.total || 0;
         setCallTotalRecords(total)
         setCallTotalPages(Math.ceil(total / 10) || 1)
      } else {
         setCallRecords([])
      }
    } catch(error: any) {
      toast.error("Failed to load call records")
      setCallRecords([])
    }
  }

  const loadFollowUps = async () => {
    try {
      if (!id) return;
      const response = await apiFetch(`calls?agent_id=${id}&status=callback&limit=1000`, { method: "GET" })
      if (!response.ok) throw new Error("Failed to load follow-ups")
      const json = await response.json()

      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const uniqueOwnerIds = json.data.map((c: any) => c.owner_id).filter((oid: any, index: number, arr: any[]) => oid && arr.indexOf(oid) === index);
        const ownerPromises = uniqueOwnerIds.map((ownerId: any) =>
          apiFetch(`owners/${ownerId}`, { method: 'GET' }).then(res => res.ok ? res.json() : null)
        );
        const ownersData = await Promise.all(ownerPromises);

        const ownerMap: Record<string, {name: string, phone: string}> = {};
        ownersData.forEach(owner => {
          if (owner && owner.id) {
            ownerMap[owner.id] = { name: owner.name || `Owner #${owner.id}`, phone: owner.phones && owner.phones.length > 0 ? owner.phones.map((p: any) => p.phone).join(" ") : "N/A" };
          }
        });

        const formattedFollowUps = json.data.map((call: any) => {
           const callDate = new Date(call.time);
           callDate.setDate(callDate.getDate() + 1);
           return { id: call.id, owner: ownerMap[call.owner_id]?.name || `Owner #${call.owner_id}`, number: ownerMap[call.owner_id]?.phone || "N/A", attempts: 1, nextDial: callDate.toISOString().split("T")[0] }
        });
        setFollowUps(formattedFollowUps);
      } else {
        setFollowUps([]);
      }
    } catch(error: any) {
      console.error("Failed to load follow-ups");
      setFollowUps([]);
    }
  }

  const loadCallingWindows = async () => {
    try {
      if (!id) return;
      const now = new Date();
      const toDate = new Date(now);
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);

      const tempDaysList: string[] = [];
      const dateObjects: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dateObjects.push(d);
        tempDaysList.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }

      const res = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=5000`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to load calling window stats");
      const json = await res.json();

      const grid = Array.from({ length: 7 }, () => Array(10).fill(0));

      if (json && Array.isArray(json.data)) {
        json.data.forEach((call: any) => {
          const callDate = new Date(call.time);
          const callDateStr = callDate.toDateString();
          const dayIndex = dateObjects.findIndex(d => d.toDateString() === callDateStr);
          if (dayIndex !== -1) {
            const localHour = callDate.getHours();
            let hourIndex = 0;
            if (localHour < 9) hourIndex = 0;
            else if (localHour > 18) hourIndex = 9;
            else hourIndex = localHour - 9;
            grid[dayIndex][hourIndex]++;
          }
        });
      }
      setHeatmapDays(tempDaysList);
      setHeatmapData(grid);
    } catch (error: any) {
      console.error(error);
    }
  };

  // --- CSV EXPORTS ---
  const exportCallsToCSV = async () => {
    const loadingToast = toast.loading("Fetching all records for export...");
    const now = new Date();
    let fromDate = new Date(now);
    let toDate = new Date(now);

    if (date) { fromDate = new Date(date); fromDate.setHours(0, 0, 0, 0); toDate = new Date(date); toDate.setHours(23, 59, 59, 999); }
    else if (dateRange === "Today") { fromDate.setHours(0, 0, 0, 0); }
    else if (dateRange === "Past Week") { fromDate.setDate(now.getDate() - 7); }
    else if (dateRange === "Past Month") { fromDate.setMonth(now.getMonth() - 1); }
    else if (dateRange === "Past Year") { fromDate.setFullYear(now.getFullYear() - 1); }

    try {
      const response = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10000`, { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch export data");
      const jsonResponse = await response.json();
      const allCalls = jsonResponse.data || [];

      if (allCalls.length === 0) {
        toast.dismiss(loadingToast); toast.info("No records found to export."); return;
      }

      const uniqueOwnerIds = allCalls.map((r: any) => r.owner_id).filter((oid: any, index: number, arr: any[]) => oid && arr.indexOf(oid) === index);
      const missingOwners = uniqueOwnerIds.filter((oid: any) => !ownerDetails[oid]);
      const tempOwnerMap = { ...ownerDetails };

      if (missingOwners.length > 0) {
        const ownerPromises = missingOwners.map((ownerId: any) => apiFetch(`owners/${ownerId}`, { method: 'GET' }).then(res => res.ok ? res.json() : null));
        const ownersData = await Promise.all(ownerPromises);
        ownersData.forEach(owner => {
          if (owner && owner.id) tempOwnerMap[owner.id] = { name: owner.name || `Owner #${owner.id}`, phone: owner.phones && owner.phones.length > 0 ? owner.phones.map((p: any) => p.phone).join(", ") : "N/A" };
        });
      }

      const headers = ["ID", "Time", "Project", "Status", "Duration", "Owner", "Owner Phone", "Notes"];
      const csvContent = [
        headers.join(","),
        ...allCalls.map((l: any) => [
          l.id, `"${l.time}"`, `"${projectDetails[l.project_id] || `Project #${l.project_id}`}"`, `"${l.status}"`, `"${l.duration || 0}s"`,
          `"${tempOwnerMap[l.owner_id]?.name || `Owner #${l.owner_id}`}"`, `"${tempOwnerMap[l.owner_id]?.phone || ""}"`, `"${l.agent_notes || ''}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `agent_${id}_export_ALL_${dateRange.replace(" ", "_")}.csv`);
      a.click();

      toast.dismiss(loadingToast); toast.success(`Successfully exported ${allCalls.length} records!`);
    } catch (error) {
      toast.dismiss(loadingToast); toast.error("Failed to generate export file.");
    }
  }

  // --- EXCEL / CSV UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Format Not Supported", { description: "Please upload a .csv or .xlsx file." })
      e.target.value = ""
      return
    }
    setUploadFile(file)
  }

  const handleAddPhoneField = () => {
    setPhoneFields(prev => [...prev, `Phone ${prev.length + 1}`])
  }

  const resetModals = () => {
    setIsUploadOpen(false);
    setUploadStep(1);
    setUploadFile(null);
    setColumnMapping({});
    setStartRow(2);
    setEndRow("");
    setPhoneFields(["Primary Phone"]);
    setExcelHeaders([]);
  }

  const indexToLetter = (index: number): string => {
    let result = '';
    let i = index;
    while (i >= 0) {
      result = String.fromCharCode((i % 26) + 65) + result;
      i = Math.floor(i / 26) - 1;
    }
    return result;
  }

  const parseExcelHeaders = async () => {
    if (!uploadFile) return;
    try {
      const buffer = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, raw: false });
      const headerRow = rows[0];
      if (headerRow && headerRow.length > 0) {
        const headers = headerRow.map((cell, idx) => ({
          label: cell ? String(cell).trim() : `Column ${indexToLetter(idx)}`,
          letter: indexToLetter(idx),
        })).filter(h => h.label !== '');
        setExcelHeaders(headers);
      } else {
        setExcelHeaders([]);
        toast.error("Could not read headers", { description: "The first row of your file appears to be empty." });
      }
    } catch (err) {
      console.error("Failed to parse headers:", err);
      setExcelHeaders([]);
      toast.error("Failed to read file headers.");
    }
  }

  const handleGoToMapping = async () => {
    await parseExcelHeaders();
    setUploadStep(2);
  }

  // The parsed JSON payload will be POSTed directly to `owners/bulk` endpoint
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return;

    try {
      toast.loading("Parsing file and assigning clients...", { id: "upload-toast" })

      const buffer = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // header: 1 returns a 2D array of rows and columns. raw: false ensures cells are read as formatted text.
      const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, raw: false });

      // Filter out completely empty rows created by random formatting in Excel
      const validRows = rows.filter(row => row && row.length > 0);

      const startIndex = Math.max(0, startRow - 1);
      const endIndex = endRow ? Math.min(validRows.length, parseInt(endRow)) : validRows.length;

      const parsedClients: any[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        const row = validRows[i];
        if (!row) continue;

        const getVal = (fieldName: string) => {
          const letter = columnMapping[fieldName];
          if (!letter) return "";
          const val = row[letterToIndex(letter)];
          return val ? String(val).trim() : "";
        }

        // Loop through all dynamically created phone columns
        const phones = phoneFields
            .map(field => getVal(field))
            .filter(phone => !!phone) // Remove empty strings
            .map(phone => phone.replace(/\t/g, '')); // Clean export garbage

        if (phones.length === 0) continue; // Requires at least one valid phone

        parsedClients.push({
          name: getVal("Client Name") || "Unknown Client",
          phones: phones.map(p => ({ phone: p })),
          type: "OWNER",
          agent_id: id,
          info: [
            { key: "Status", value: getVal("Status") || "New" },
            { key: "Project", value: getVal("Project") || "Default Project" },
            { key: "Attempts", value: getVal("Attempts") || "0" },
            { key: "Next Dial", value: getVal("Next Dial")?.replace(/\t/g, '') || "" }
          ].filter(i => i.value !== "")
        });
      }

      // Send the correctly formatted payload to the backend API via the centralized clientsApi
      await clientsApi.bulkCreateClients(parsedClients);

      toast.success(`Successfully assigned ${parsedClients.length} new clients to your pipeline!`, { id: "upload-toast" });
      resetModals();
      loadClients(); // Automatically refetch table data from the database

    } catch (err: any) {
      toast.error(err.message || "Failed to process file.", { id: "upload-toast" })
    }
  }

  // --- LOADER ---
  if (!user) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin text-slate-400 size-8" /></div>;

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar link1Name="" link2Name="" link3Name="" />

        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                {(user?.name || "A").split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Welcome back, {user?.name?.split(" ")[0]}!
                  </h1>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: chartPalette.emerald, boxShadow: `0 0 6px ${hexToRgba(chartPalette.emerald, 0.6)}` }} />
                </div>
                <p className="text-muted-foreground mt-1">Here is your performance snapshot.</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Calls", val: totalCallsDashboard, icon: Phone, color: "text-emerald-500" },
              { title: "Success Rate", val: `${successRate}%`, icon: TrendingUp, color: "text-blue-500" },
              { title: "Avg Duration", val: `${Agent?.stats?.avg_duration_seconds || 0}s`, icon: Clock, color: "text-amber-500" },
              { title: "Active Hours", val: `${(Agent?.workHoursToday || 0).toFixed(1)}hr`, icon: Target, color: "text-indigo-500" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">{item.title}</CardTitle>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-slate-800">{item.val}</div></CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 w-full">
            {[
              { title: "Connect Rate", val: `${realConnectRate}%`, icon: Wifi, color: "text-teal-500" },
              { title: "Avg Calls / Close", val: avgAttemptsToClose, icon: Repeat, color: "text-violet-500" },
              { title: "Overdue Follow-ups", val: overdueCount, icon: AlertTriangle, color: "text-slate-400" },
            ].map((item, i) => {
              const isUrgent = item.title === "Overdue Follow-ups" && Number(item.val) > 0;
              return (
                <Card key={i} className={`w-full sm:w-[240px] shadow-sm border-slate-100 hover:shadow-md transition-shadow ${isUrgent ? 'bg-red-50' : 'background-color: hsl(var(--card))'}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className={`text-sm font-medium ${isUrgent ? 'text-rose-600' : 'text-[hsl(var(--tertiary))]'}`}>{item.title}</CardTitle>
                    <item.icon className={`h-4 w-4 ${isUrgent ? 'text-rose-600' : item.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: isUrgent ? '#e11d48' : '#1e293b' }}>
                      {item.val}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Row 1: Line Chart & Pie Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
            <Card className="md:col-span-2 lg:col-span-2 shadow-sm border-slate-100 flex flex-col">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">My Call Trends</CardTitle>
                <CardDescription>Daily call durations tracking.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[320px] w-full pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line type="monotone" dataKey="avgDuration" name="Duration (sec)" stroke={chartPalette.dial} strokeWidth={2.5} dot={{ r: 3, fill: chartPalette.dial }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 shadow-sm border-slate-100 flex flex-col">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Call Outcomes</CardTitle>
                <CardDescription>Distribution of connection statuses.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[320px] flex flex-col items-center justify-center w-full pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calls}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {calls.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                    <Legend
                      content={(props: any) => {
                        const { payload } = props;
                        return (
                          <div className="grid grid-cols-2 gap-y-2 gap-x-6 mx-auto w-fit mt-4">
                            {payload?.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-medium text-slate-600 capitalize">
                                  {String(entry.value || entry.payload?.name || "").replace("_", " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Heatmap & Pending Follow-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-6">
            <Card className="lg:col-span-2 shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Best Calling Windows</CardTitle>
                <CardDescription>Call volume by day and hour - darker means busier.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${heatmapHours.length}, minmax(0, 1fr))` }}>
                      <div />
                      {heatmapHours.map(h => (
                        <div key={h} className="text-[10px] text-slate-400 text-center pb-1 font-semibold">{h}</div>
                      ))}
                      {heatmapData.map((row, dayIdx) => (
                        <div key={heatmapDays[dayIdx]} className="contents">
                          <div className="text-xs text-slate-500 font-bold flex items-center">{heatmapDays[dayIdx]}</div>
                          {row.map((val, hourIdx) => {
                            const intensity = val / heatmapMax;
                            return (
                              <div
                                key={hourIdx}
                                title={`${heatmapDays[dayIdx]} ${heatmapHours[hourIdx]}: ${val} calls`}
                                className="aspect-square rounded-sm flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
                                style={{ backgroundColor: hexToRgba(chartPalette.dial, 0.08 + 0.85 * intensity) }}
                              >
                                <span className={`text-[10px] sm:text-xs font-bold ${intensity > 0.45 ? "text-white" : "text-slate-600"}`}>
                                  {val}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100 flex flex-col justify-between lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Pending Follow-ups</CardTitle>
                <CardDescription>Clients expecting a callback.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[280px]">
                {followUps.length > 0 ? (
                  followUps.map(f => {
                    const isOverdue = new Date(f.nextDial) < new Date("2026-07-06") // Replace with actual current date check in production
                    return (
                      <div
                        key={f.id}
                        className="flex justify-between items-center p-3 border rounded-lg gap-2 transition-colors hover:bg-slate-50"
                        style={isOverdue
                          ? { backgroundColor: hexToRgba(chartPalette.miss, 0.06), borderColor: hexToRgba(chartPalette.miss, 0.25) }
                          : { borderColor: "#e2e8f0" }}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-700 truncate">{f.owner}</p>
                          <p className="text-xs text-slate-500 font-mono">{f.number}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{f.attempts} attempt{f.attempts !== 1 ? "s" : ""} so far</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-none text-white text-xs py-0.5"
                          style={{ backgroundColor: isOverdue ? chartPalette.miss : chartPalette.neutral }}
                        >
                          {isOverdue ? "Overdue" : f.nextDial}
                        </Badge>
                      </div>
                    )
                  })
                ) : (
                   <p className="text-sm text-slate-500 text-center mt-4">You have no pending follow-ups right now.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Funnel */}
          <Card className="shadow-sm border-slate-100 mt-6">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Conversion Funnel</CardTitle>
              <CardDescription>Where owners drop off between a dial and a close.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 pt-2">
                {funnelData.map((stage, i) => {
                  const widthPct = 100 - i * 12
                  const prevValue = i > 0 ? funnelData[i - 1].value : stage.value
                  const dropOffPct = i > 0 && prevValue > 0 ? Math.round((1 - stage.value / prevValue) * 100) : 0
                  return (
                    <div key={stage.stage} className="flex-1 flex flex-col items-center relative">
                      <div
                        className="rounded-md flex items-center justify-center text-white font-semibold text-sm py-3 transition-all"
                        style={{ backgroundColor: stage.color, width: `${widthPct}%`, minWidth: "80px" }}
                      >
                        {stage.value}
                      </div>
                      <p className="text-xs font-semibold mt-2 text-slate-700">{stage.stage}</p>
                      {i > 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">-{dropOffPct}% drop-off</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Row 4: Call Detail Records */}
          <Card className="shadow-sm border-slate-100 mt-6">
            <CardHeader className="flex flex-col gap-5 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Call Detail Records</CardTitle>
                  <CardDescription>Search individual call logs by client name or phone number.</CardDescription>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                  <div className="relative w-full md:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search calls..."
                      className="pl-9 h-9 w-full"
                      value={callSearchTerm}
                      onChange={(e) => { setCallSearchTerm(e.target.value); setCallCurrentPage(1); }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full border-t pt-4 border-slate-100">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 w-full sm:w-auto justify-start sm:justify-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.includes("-") ? "Custom" : dateRange}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background border-border shadow-md">
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handleCallPresetDateChange("Today")}>Today</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handleCallPresetDateChange("Past Week")}>Past Week</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handleCallPresetDateChange("Past Month")}>Past Month</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handleCallPresetDateChange("Past Year")}>Past Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex items-center w-full sm:w-auto">
                    <input
                      type="date"
                      onChange={handleCallDateChange}
                      className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-slate-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                  <Button onClick={exportCallsToCSV} variant="default" className="h-9 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="block w-full overflow-x-auto">
                <Table className="min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="pr-6">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecords.length > 0 ? displayRecords.map(log => {
                      const dateObj = log.time ? new Date(log.time) : new Date();
                      return(
                      <TableRow key={log.id} className="hover:bg-slate-50/55">
                        <TableCell className="pl-6 font-medium whitespace-nowrap">{dateObj.toLocaleDateString()}</TableCell>
                        <TableCell className="whitespace-nowrap text-slate-500">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-slate-700">{log.project_id ? (projectDetails[log.project_id] || `Project #${log.project_id}`) : "-"}</TableCell>
                        <TableCell>
                          <Badge className="border-none text-white text-xs font-semibold py-0.5 capitalize" style={{backgroundColor: getStatusColor(log.status)}}>
                            {(log.status || "Unknown").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{log.duration}s</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{ownerDetails[log.owner_id]?.name || `Owner #${log.owner_id}`}</span><br/>
                          <span className="text-xs text-muted-foreground">{ownerDetails[log.owner_id]?.phone || ""}</span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate pr-6 text-slate-600">{log.agent_notes || "�"}</TableCell>
                      </TableRow>
                    )}) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No calls found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-slate-100 p-4 sm:p-6">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{callTotalRecords === 0 ? 0 : ((callCurrentPage - 1) * 10) + 1}</strong> to <strong>{Math.min(callCurrentPage * 10, callTotalRecords)}</strong> of <strong>{callTotalRecords}</strong> calls
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={callCurrentPage <= 1} onClick={() => setCallCurrentPage(p => Math.max(p - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-sm font-medium px-2">Page {callCurrentPage} of {callTotalPages}</div>
                <Button variant="outline" size="sm" disabled={callCurrentPage >= callTotalPages} onClick={() => setCallCurrentPage(p => Math.min(p + 1, callTotalPages))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>

          {/* Row 5: My Pipeline (Clients Table) */}
          <Card className="shadow-sm border-slate-100 flex flex-col mt-6">
            <CardHeader className="flex flex-col gap-5 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-xl">My Pipeline</CardTitle>
                  <CardDescription>Manage your assigned clients or upload new lists.</CardDescription>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                  <div className="relative w-full md:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search clients..."
                      className="pl-9 h-9 w-full"
                      value={clientSearchTerm}
                      onChange={(e) => { setClientSearchTerm(e.target.value); setClientCurrentPage(1); }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full border-t pt-4 border-slate-100">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
                  <select
                    className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                    value={clientStatusFilter}
                    onChange={(e) => { setClientStatusFilter(e.target.value); setClientCurrentPage(1); }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Voicemail">Voicemail</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                  <Button onClick={() => setIsUploadOpen(true)} className="h-9 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Clients
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="block w-full overflow-x-auto">
                <Table className="min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="pl-6">Client Name</TableHead>
                      <TableHead>Primary Phone</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Attempts</TableHead>
                      <TableHead>Next Dial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length > 0 ? clients.map(client => (
                      <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 font-semibold text-slate-800 whitespace-nowrap">{client.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                          {client.phones?.[0]?.phone || client.primaryNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium whitespace-nowrap">{client.projects?.join(', ') || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="font-semibold border-none text-white py-0.5 capitalize"
                            style={{backgroundColor: getStatusColor(client.status)}}
                          >
                            {client.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">{client.attemptCount || 0}</TableCell>
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">{client.nextDialAt || "�"}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                          Your pipeline is empty. Click "Upload Clients" to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-slate-100 p-4 sm:p-6">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{clientTotalRecords === 0 ? 0 : (clientCurrentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(clientCurrentPage * ITEMS_PER_PAGE, clientTotalRecords)}</strong> of <strong>{clientTotalRecords}</strong> clients
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={clientCurrentPage === 1} onClick={() => setClientCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-sm font-medium px-2">Page {clientCurrentPage} of {clientTotalPages}</div>
                <Button variant="outline" size="sm" disabled={clientCurrentPage >= clientTotalPages} onClick={() => setClientCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>

        </main>
      </div>

      {/* --- UPLOAD MODAL --- */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !open && resetModals()}>
        {/* Added: max-h-[90vh] flex flex-col to lock the modal height and prevent screen overflow */}
        <DialogContent className="sm:max-w-[550px] bg-background max-h-[90vh] flex flex-col">

          <DialogHeader className="shrink-0">
            <DialogTitle>Upload My Leads</DialogTitle>
            <DialogDescription>
              {uploadStep === 1 ? "Upload a CSV or Excel file to add leads directly to your pipeline." : "Map the columns in your file. These will be securely assigned to you."}
            </DialogDescription>
          </DialogHeader>

          {uploadStep === 1 ? (
            <div className="space-y-4 pt-4 shrink-0">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 cursor-pointer relative">
                <input type="file" accept=".csv, .xlsx, .xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} />
                <FileSpreadsheet className={`h-12 w-12 mb-4 ${uploadFile ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className="text-base font-semibold text-slate-700">{uploadFile ? uploadFile.name : "Select .csv or .xlsx file"}</span>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={resetModals}>Cancel</Button>
                <Button disabled={!uploadFile} onClick={handleGoToMapping} className="bg-blue-600 hover:bg-blue-700 text-white">Next Step</Button>
              </DialogFooter>
            </div>
          ) : (
            // Added: overflow-hidden min-h-0 to the form wrapper
            <form onSubmit={handleFinalSubmit} className="flex flex-col overflow-hidden min-h-0">

              {/* Added: flex-1 overflow-y-auto to create the internal scrollbar! */}
              <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-2">

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1"><Label>Start Row</Label><Input type="number" min={1} value={startRow} onChange={(e) => setStartRow(Number(e.target.value))} /></div>
                  <div className="space-y-2 flex-1"><Label>End Row</Label><Input type="number" min={1} placeholder="(EOF)" value={endRow} onChange={(e) => setEndRow(e.target.value)} /></div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <Label className="text-xs uppercase text-slate-500 font-bold">Map System Fields</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPhoneField} className="h-7 px-2 text-xs flex items-center gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                      <Plus className="h-3.5 w-3.5" /> Add Phone Column
                    </Button>
                  </div>

                  {[...phoneFields, ...systemFields].map(field => (
                    <div key={field} className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium w-1/2">{field} {field.includes("Primary Phone") && <span className="text-red-500">*</span>}</span>
                      <select
                        className="flex h-10 w-1/2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                        value={columnMapping[field] || ""}
                        onChange={(e) => setColumnMapping(prev => ({...prev, [field]: e.target.value}))}
                      >
                        <option value="">— Select column —</option>
                        {excelHeaders.map(h => (
                          <option key={h.letter} value={h.letter}>{h.label} ({h.letter})</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Added: shrink-0 mt-4 border-t to pin the buttons to the bottom */}
              <DialogFooter className="pt-6 shrink-0 mt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setUploadStep(1)}>Back</Button>
                <Button type="submit" disabled={!columnMapping["Primary Phone"]} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle2 className="mr-2 h-4 w-4"/> Import to Pipeline
                </Button>
              </DialogFooter>

            </form>
          )}
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" richColors />
    </>
  )
}
