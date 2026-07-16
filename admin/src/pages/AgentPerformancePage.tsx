import {useState, useMemo, useRef, useEffect} from "react"
import { useParams } from "react-router-dom"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import {
  ChevronLeft, ChevronRight, Phone, Target, Clock, TrendingUp, Calendar, FileText, Download, Loader2,
  AlertTriangle, Wifi, Repeat
} from "lucide-react"
import AppNavbar from "@/components/AppNavbar.tsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "sonner"
import AgentReport from "@/components/AgentReport.tsx"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import {apiFetch} from "@/lib/api.tsx";

const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  convert: "#4F46E5",
  miss: "#FB7185",
  neutral: "#94A3B8",
  emerald: "#10B981"
}

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

export default function AgentPerformancePage() {
  // --- INITIALIZATION ---
  const { id } = useParams()
  const [Agent, setAgent] = useState<any>({})

  const [dateRange, setDateRange] = useState("Today")
  const [date, setDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // --- SERVER SIDE PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // --- CALL TRENDS ---
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [callRecords, setCallRecords] = useState<any[]>([])

  // --- DICTIONARIES FOR RESOLVING IDs TO NAMES ---
  const [ownerDetails, setOwnerDetails] = useState<Record<string, {name: string, phone: string}>>({})
  const [projectDetails, setProjectDetails] = useState<Record<string, string>>({})
  const [followUps, setFollowUps] = useState<any[]>([])

  // --- REAL DATA KPIs ---
  const totalCallsDashboard = Agent?.stats?.total_calls || 0;
  const answeredCalls = Agent?.stats?.answered || 0;
  const closedCalls = Agent?.stats?.closed || 0;
  const successRate = totalCallsDashboard > 0 ? Math.round((closedCalls / totalCallsDashboard) * 100) : 0;
  const realConnectRate = totalCallsDashboard > 0 ? Math.round((answeredCalls / totalCallsDashboard) * 100) : 0;

  const today = new Date();
  today.setHours(0,0,0,0);

  // Checks the scheduled callback date against today's date
  const overdueCount = followUps.filter(f => new Date(f.nextDial) < today).length

  // Safely calculates attempts without crashing if the array is empty
  const avgAttemptsToClose = closedCalls > 0
    ? (totalCallsDashboard / closedCalls).toFixed(1)
    : "0.0";

  // --- CONVERSION FUNNEL DATA ---
  const funnelData = [
    { stage: "Dialed", value: totalCallsDashboard, color: statusPalette.dial },
    { stage: "Answered", value: answeredCalls, color: statusPalette.answered },
    { stage: "Callback", value: Agent?.stats?.callback || 0, color: statusPalette.callback },
    { stage: "Closed", value: closedCalls, color: statusPalette.closed },
  ]

  // --- REAL-TIME CALLING WINDOW STATES ---
  const [heatmapDays, setHeatmapDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array.from({ length: 7 }, () => Array(10).fill(0)))
  const heatmapMax = useMemo(() => {
    const flat = heatmapData.flat();
    const maxVal = Math.max(...flat);
    return maxVal > 0 ? maxVal : 1; // Prevents division by 0 if there are no calls
  }, [heatmapData]);


  // --- TEAM DATA ---
  const [teamStats, setTeamStats] = useState<any>(null)
  const benchmarkData = useMemo(() => {
    if (!Agent?.stats || !teamStats) return [];

    // Agent Specific Metrics
    const aTotal = Agent.stats.total_calls || 0;
    const aConnectRate = aTotal > 0 ? Math.round((Agent.stats.answered / aTotal) * 100) : 0;
    const aConversion = aTotal > 0 ? Math.round((Agent.stats.closed / aTotal) * 100) : 0;
    const aCallbackRate = aTotal > 0 ? Math.round((Agent.stats.callback / aTotal) * 100) : 0;

    // Team Average Metrics
    const tTotalAvg = teamStats.activeMembers > 0 ? Math.round(teamStats.totalCalls / teamStats.activeMembers) : 0;
    const tConnectRate = teamStats.totalCalls > 0 ? Math.round((teamStats.answered / teamStats.totalCalls) * 100) : 0;
    const tConversion = teamStats.totalCalls > 0 ? Math.round((teamStats.closed / teamStats.totalCalls) * 100) : 0;
    const tCallbackRate = teamStats.totalCalls > 0 ? Math.round((teamStats.callbacks / teamStats.totalCalls) * 100) : 0;

    return [
      { metric: "Calls Made", agent: aTotal, team: tTotalAvg },
      { metric: "Connect Rate", agent: aConnectRate, team: tConnectRate },
      { metric: "Avg Duration", agent: Agent.stats.avg_duration_seconds || 0, team: teamStats.averageDuration },
      { metric: "Closes", agent: aConversion, team: tConversion },
      { metric: "Callback Rate", agent: aCallbackRate, team: tCallbackRate },
    ];
  }, [Agent, teamStats]);

  // --- PROJECTS ---
  const [projects , setProjects] = useState<any[]>([])


  // --- HELPER FUNCTIONS ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDate(e.target.value)
      setDateRange(e.target.value)
      setCurrentPage(1)
    }
  }

  const handlePresetDateChange = (range: string) => {
    setDateRange(range)
    setDate("")
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    if (!status) return chartPalette.neutral;
    const formatted = status.toLowerCase().replace(" ", "_") as keyof typeof statusPalette;

    // If it's a known color, use it!
    if (statusPalette[formatted]) return statusPalette[formatted];

    // If it's unknown, generate a consistent pseudo-random color based on the string text
    // This ensures that "weird_status" always gets the exact same color and never flashes
    let hash = 0;
    for (let i = 0; i < formatted.length; i++) {
      hash = formatted.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `#${(hash & 0x00FFFFFF).toString(16).padStart(6, '0')}`;
  }

  // Frontend search over the currently loaded 10 records AND the fetched dictionary values
  const displayRecords = callRecords.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const ownerInfo = ownerDetails[log.owner_id] || { name: "", phone: "" };
    const projectName = projectDetails[log.project_id] || "";

    return String(log.owner_id).includes(term) ||
           (log.agent_notes || "").toLowerCase().includes(term) ||
           ownerInfo.name.toLowerCase().includes(term) ||
           ownerInfo.phone.toLowerCase().includes(term) ||
           projectName.toLowerCase().includes(term);
  });

  // --- CSV EXPORT ---
  const exportToCSV = async () => {
    const loadingToast = toast.loading("Fetching all records for export...");

    // 1. Re-calculate the current active date filters
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
      // 2. Fetch up to 10,000 records at once just for the export
      const response = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10000`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to fetch export data");
      const jsonResponse = await response.json();
      const allCalls = jsonResponse.data || [];

      if (allCalls.length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No records found to export.");
        return;
      }

      // 3. Fetch any missing Owner/Project names for this massive list
      const uniqueOwnerIds = allCalls.map((r: any) => r.owner_id).filter((id: any, index: number, arr: any[]) => id && arr.indexOf(id) === index);
      const missingOwners = uniqueOwnerIds.filter((id: any) => !ownerDetails[id]);

      const tempOwnerMap = { ...ownerDetails };

      if (missingOwners.length > 0) {
        const ownerPromises = missingOwners.map((ownerId: any) =>
          apiFetch(`owners/${ownerId}`, { method: 'GET' }).then(res => res.ok ? res.json() : null)
        );
        const ownersData = await Promise.all(ownerPromises);

        ownersData.forEach(owner => {
          if (owner && owner.id) {
            tempOwnerMap[owner.id] = {
              name: owner.name || `Owner #${owner.id}`,
              phone: owner.phones && owner.phones.length > 0 ? owner.phones.map((p: any) => p.phone).join(", ") : "N/A"
            };
          }
        });
      }

      // 4. Construct the CSV using the massive array, not the paginated state
      const headers = ["ID", "Time", "Project", "Status", "Duration", "Owner", "Owner Phone", "Notes"];
      const csvContent = [
        headers.join(","),
        ...allCalls.map((l: any) => {
          const ownerName = tempOwnerMap[l.owner_id]?.name || `Owner #${l.owner_id}`;
          const ownerPhone = tempOwnerMap[l.owner_id]?.phone || "";
          const projectName = projectDetails[l.project_id] || `Project #${l.project_id}`;

          return [
            l.id,
            `"${l.time}"`,
            `"${projectName}"`,
            `"${l.status}"`,
            `"${l.duration || 0}s"`,
            `"${ownerName}"`,
            `"${ownerPhone}"`,
            `"${l.agent_notes || ''}"`
          ].join(",");
        })
      ].join("\n");

      // 5. Trigger the Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `agent_${id}_export_ALL_${dateRange.replace(" ", "_")}.csv`);
      a.click();

      toast.dismiss(loadingToast);
      toast.success(`Successfully exported ${allCalls.length} records!`);

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate export file.");
    }
  }

  // --- REPORT MAKING ---
  const addCanvasAcrossPages = (
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    startY: number,
    margin: number,
    usableWidth: number,
    pageHeight: number
  ) => {
    const scaleFactor = usableWidth / canvas.width
    const imgHeightMm = canvas.height * scaleFactor
    const availableOnCurrentPage = pageHeight - margin - startY

    if (imgHeightMm <= availableOnCurrentPage) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, startY, usableWidth, imgHeightMm)
      return startY + imgHeightMm
    }

    const fullPageHeight = pageHeight - margin * 2
    if (imgHeightMm <= fullPageHeight) {
      pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imgHeightMm)
      return margin + imgHeightMm
    }

    pdf.addPage()
    const pageHeightPx = fullPageHeight / scaleFactor
    let renderedPx = 0
    let cursorY = margin
    let firstSlice = true

    while (renderedPx < canvas.height) {
      if (!firstSlice) {
        pdf.addPage()
        cursorY = margin
      }
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
        const sliceHeightMm = sliceHeightPx * scaleFactor
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, cursorY, usableWidth, sliceHeightMm)
        cursorY += sliceHeightMm
      }
      renderedPx += sliceHeightPx
      firstSlice = false
    }
    return cursorY
  }

  // --- REPORT DOWNLOAD ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return
    setIsGeneratingPDF(true)
    const loadingToast = toast.loading("Serializing layout containers...")

    try {
      const sections = Array.from(
        reportRef.current.querySelectorAll<HTMLElement>('[data-pdf-section]')
      )
      if (sections.length === 0) throw new Error("No report sections found to render")

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const gap = 4

      let cursorY = margin
      let isFirstSection = true

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        })

        if (!isFirstSection) cursorY += gap
        cursorY = addCanvasAcrossPages(pdf, canvas, cursorY, margin, usableWidth, pageHeight)
        isFirstSection = false
      }

      pdf.save(`Agent_Report_${Agent.name}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.dismiss(loadingToast)
      toast.success("Report Saved to Downloads Folder")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss(loadingToast)
      toast.error("Report Generation Failed")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // --- FOR OVERALL STATS ---
  const getOverallDateRange = () => {
    const now = new Date();
    const past = new Date("2020-01-01"); // ANY DATE BEFORE THE MAKING OF THE APPLICATION

    return {
      from: past.toISOString(),
      to: now.toISOString()
    };
  };

  // EFFECT 1: Fetch heavy dashboard profile and charting data only on first load
  useEffect(() => {
    loadAgentData()
    loadWeeklyAvgDuration()
    loadTeamData()
    loadCallPerProject()
    loadFollowUps()
    loadCallingWindows()
  }, [])

  // EFFECT 2: Fetch the paginated table records dynamically anytime a filter or page flips
  useEffect(() => {
    loadCallRecords()
  }, [currentPage, dateRange, date])

  // EFFECT 3: Whenever callRecords updates, check if we need to fetch missing owner or project names
  useEffect(() => {
    const fetchMissingDetails = async () => {
      const uniqueOwnerIds = callRecords.map(r => r.owner_id).filter((id, index, arr) => id && arr.indexOf(id) === index);
      const uniqueProjectIds = callRecords.map(r => r.project_id).filter((id, index, arr) => id && arr.indexOf(id) === index);

      const missingOwners = uniqueOwnerIds.filter(id => !ownerDetails[id]);
      const missingProjects = uniqueProjectIds.filter(id => !projectDetails[id]);

      if (missingOwners.length > 0) {
        const ownerPromises = missingOwners.map(id =>
          apiFetch(`owners/${id}`, { method: 'GET' }).then(res => res.ok ? res.json() : null)
        );
        const ownersData = await Promise.all(ownerPromises);

        const newOwnerDetails = { ...ownerDetails };
        ownersData.forEach(data => {
          if (data && data.id) {
            newOwnerDetails[data.id] = {
              name: data.name || `Owner #${data.id}`,
              phone: data.phones?.[0]?.phone || "N/A"
            };
          }
        });
        setOwnerDetails(newOwnerDetails);
      }

      if (missingProjects.length > 0) {
        const projectPromises = missingProjects.map(id =>
          apiFetch(`projects/${id}`, { method: 'GET' }).then(res => res.ok ? res.json() : null)
        );
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

    if (callRecords.length > 0) {
      fetchMissingDetails();
    }
  }, [callRecords])

  // --- API CALLS FOR LOADING ALL THE DATA ---
  const loadAgentData = async () => {
    try {
      const profileResponse = await apiFetch(`users/${id}`, {
        method: "GET",
      })
      if (!profileResponse.ok) throw new Error("Failed to load agent profile")
      const profileData = await profileResponse.json()

      const { from, to } = getOverallDateRange();
      const statsResponse = await apiFetch(`users/${id}/stats?from=${from}&to=${to}`, {
        method: "GET",
      })
      if (!statsResponse.ok) throw new Error("Failed to load agent stats")
      const statsData = await statsResponse.json()

      const preCombinedData = {
        ...profileData,
        stats: statsData
      }
      let now = new Date();
      let start = new Date(now);
      start.setHours(0, 0, 0, 0)
      const startIsoString = start.toISOString()
      const nowISOString = now.toISOString()


      const workHoursResponse = await apiFetch(`users/${id}/stats?from=${startIsoString}&to=${nowISOString}`, {
        method: "GET",
      })

      if(!workHoursResponse.ok) throw new Error("Failed to load agent workHours")

      const workHours = await workHoursResponse.json()
      const combinedData = {
        ...preCombinedData,
        workHoursToday: workHours.total_session_time_seconds/3600
      }

      const keys = ["avg_duration_seconds", "total_calls","total_session_time_seconds"]
      const copy = {... statsData}
      keys.forEach((key) => {
        delete copy[key]
      })

      let formattedCallsArray = Object.entries(copy)
        .filter(([_, countValue]) => Number(countValue) > 0) // Explicitly filter out zero-values so Recharts doesn't fail silently
        .map(([statusKey, countValue]) => ({
          name: statusKey,
          value: Number(countValue), // Convert string numbers to strict Number types for the PieChart
          color: getStatusColor(statusKey) // Will grab the fixed colors, or assign a random one for new ones!
      }))

      if (formattedCallsArray.length === 0) {
        formattedCallsArray = [
          { name: "no_data_yet", value: 1, color: "#f1f5f9" } // Light grey placeholder
        ]
      }
      setCalls(formattedCallsArray)
      setAgent(combinedData)

    } catch(error: any) {
      toast.error(error.message)
    }
  }

  const loadWeeklyAvgDuration = async () => {
    try{
        const weekRanges = Array.from({ length: 7 }).map((_, index) => {
        const daysAgo = 6 - index;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAgo);

        const fromDate = new Date(targetDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(targetDate);
        toDate.setHours(23, 59, 59, 999);

        return {
          dayLabel: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        };
      });

      const weeklyData = await Promise.all(
        weekRanges.map(async (range) => {
          const localizedDate = range.to.split('T')[0]
          try {
            const response = await apiFetch(`users/${id}/stats?from=${range.from}&to=${range.to}`, {
              method: "GET",
            });

            if (!response.ok) {
              return { date: localizedDate, avgDuration: 0 };
            }

            const data = await response.json();
            return {
              day: localizedDate,
              avgDuration: data.avg_duration_seconds || 0,
            };

          } catch (err) {
            return { date: localizedDate, avgDuration: 0 };
          }
        })

      );
      setWeeklyChartData(weeklyData)
    }catch(error: any) {
      toast.error(error.message)
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
      const response = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10`, {
        method: "GET",
      })

      if (!response.ok) {
        setCallRecords([])
        setTotalPages(1)
        setTotalRecords(0)
        return
      }

      const jsonResponse = await response.json();

      if (jsonResponse && Array.isArray(jsonResponse.data)) {
         setCallRecords(jsonResponse.data)
         const total = jsonResponse.meta?.total || 0;
         setTotalRecords(total)
         setTotalPages(Math.ceil(total / 10) || 1)
      } else {
         setCallRecords([])
      }
    } catch(error: any) {
      toast.error("Failed to load call records")
      setCallRecords([])
    }
  }

  const loadTeamData = async () => {
    try {
      const teamResponse = await apiFetch("users?role=user", {
        method: "GET",
      });

      if (!teamResponse.ok) {
        throw new Error("Failed to load team data");
      }

      const teamData = await teamResponse.json();

      const activeTeamIDs = teamData
        .filter((user: any) => String(user.id) !== String(id))
        .map((user: any) => user.id);

      if (activeTeamIDs.length === 0) return;

      const { from, to } = getOverallDateRange();

      const teamPromises = activeTeamIDs.map((teamID: number) =>
        apiFetch(`users/${teamID}/stats?from=${from}&to=${to}`, { method: "GET" })
          .then(res => res.ok ? res.json() : null)
      );

      // Fire all network requests in parallel
      const allTeamStats = await Promise.all(teamPromises);

      // Initialize our calculation buckets
      let sumTotalCalls = 0;
      let sumAnswered = 0;
      let sumCallbacks = 0;
      let sumClosed = 0;
      let sumAvgDuration = 0;
      let validDurationAgents = 0;

      // Loop through the results and tally everything up
      allTeamStats.forEach(stats => {
        if (stats) {
          sumTotalCalls += stats.total_calls || 0;
          sumAnswered += stats.answered || 0;
          sumCallbacks += stats.callback || 0;
          sumClosed += stats.closed || 0;

          // For duration, we calculate the average of the team's averages
          if (stats.avg_duration_seconds > 0) {
            sumAvgDuration += stats.avg_duration_seconds;
            validDurationAgents += 1;
          }
        }
      });

      const teamAverageDuration = validDurationAgents > 0
        ? Math.round(sumAvgDuration / validDurationAgents)
        : 0;

      setTeamStats({
      totalCalls: sumTotalCalls,
      answered: sumAnswered,
      callbacks: sumCallbacks,
      closed: sumClosed,
      averageDuration: teamAverageDuration,
      activeMembers: activeTeamIDs.length
      });

    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const loadCallPerProject = async () => {
    // 1. Grab the exact same date window you use for your other tables
    const {from, to} = getOverallDateRange();

    try {
      // 2. Fetch the master list of all projects
      const projectsResponse = await apiFetch("projects", {
        method: "GET",
      });

      if (!projectsResponse.ok) {
        throw new Error("Failed to load projects");
      }

      const allProjects = await projectsResponse.json();

      // 3. Fire a parallel, lightweight API request for EACH project using limit=1
      const projectPromises = allProjects.map(async (project: any) => {
        const res = await apiFetch(`calls?agent_id=${id}&project_id=${project.id}&from=${from}&to=${to}&limit=1`, {
          method: "GET"
        });

        if (!res.ok) return { name: project.name, calls: 0 };

        const json = await res.json();

        return {
          name: project.name,
          calls: json.meta?.total || 0
        };
      });

      const rawProjectData = await Promise.all(projectPromises);

      // 4. Filter out any projects that have 0 calls so the Bar Chart stays clean
      const activeProjectsData = rawProjectData.filter(p => p.calls > 0);

      setProjects(activeProjectsData);

    } catch(error: any) {
      toast.error(error.message);
    }
  }

  const loadFollowUps = async () => {
    try {
      // 1. Fetch the most recent calls with the 'callback' status for this agent
      const response = await apiFetch(`calls?agent_id=${id}&status=callback&limit=1000`, {
        method: "GET",
      })

      if (!response.ok) throw new Error("Failed to load follow-ups")

      const json = await response.json()

      if (json && Array.isArray(json.data) && json.data.length > 0) {

        // 2. Safely grab unique owner IDs
        const uniqueOwnerIds = json.data
          .map((c: any) => c.owner_id)
          .filter((id: any, index: number, arr: any[]) => id && arr.indexOf(id) === index);

        // 3. Fetch missing owner names and phone numbers in parallel
        const ownerPromises = uniqueOwnerIds.map((ownerId: any) =>
          apiFetch(`owners/${ownerId}`, { method: 'GET' }).then(res => res.ok ? res.json() : null)
        );
        const ownersData = await Promise.all(ownerPromises);

        // 4. Map them into a fast dictionary
        const ownerMap: Record<string, {name: string, phone: string}> = {};
        ownersData.forEach(owner => {
          if (owner && owner.id) {
            ownerMap[owner.id] = {
              name: owner.name || `Owner #${owner.id}`,
              phone: owner.phones && owner.phones.length > 0
                ? owner.phones.map((p: any) => p.phone).join(" ")
                : "N/A"
            };
          }
        });

        // 5. Format the data to perfectly match the UI structure
        const formattedFollowUps = json.data.map((call: any) => {
           const callDate = new Date(call.time);
           // Let's assume the callback was scheduled for 1 day after the call happened
           callDate.setDate(callDate.getDate() + 1);

           return {
             id: call.id,
             owner: ownerMap[call.owner_id]?.name || `Owner #${call.owner_id}`,
             number: ownerMap[call.owner_id]?.phone || "N/A",
             attempts: 1, // Without a historical count API, we default to 1 attempt
             nextDial: callDate.toISOString().split("T")[0]
           }
        });

        setFollowUps(formattedFollowUps);
      } else {
        setFollowUps([]);
      }
    } catch(error: any) {
      toast.error("Failed to load follow-ups");
      setFollowUps([]);
    }
  }

  const loadCallingWindows = async () => {
    try {
      const now = new Date();
      const toDate = new Date(now);
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);

      // Generate localized date representations and index targets
      const tempDaysList: string[] = [];
      const dateObjects: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dateObjects.push(d);
        tempDaysList.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }

      const res = await apiFetch(`calls?agent_id=${id}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=5000`, {
        method: "GET"
      });

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

            // Boundary Condition Math:
            if (localHour < 9) {
              hourIndex = 0; // Pre-9am added to 9am
            } else if (localHour > 18) {
              hourIndex = 9; // Post-6pm added to 6pm
            } else {
              hourIndex = localHour - 9; // 9am => 0, 10am => 1, etc.
            }
            grid[dayIndex][hourIndex]++;
          }
        });
      }

      setHeatmapDays(tempDaysList);
      setHeatmapData(grid);
    } catch (error: any) {
      toast.error("Failed to calculate calling windows");
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar />
        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">

            {/* Agent Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                {(Agent?.name || "").split(" ").map((n: string) => n[0]).join("")}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {Agent?.name}
                  </h1>

                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: Agent.is_online
                        ? chartPalette.emerald
                        : "#cbd5e1",
                      boxShadow: Agent.is_online
                        ? `0 0 6px ${hexToRgba(chartPalette.emerald, 0.6)}`
                        : "none",
                    }}
                    title={Agent.is_online ? "Online" : "Offline"}
                  />
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-muted-foreground">
                    Agent
                  </p>

                  <Badge
                    className="px-3 py-1 text-white border-none"
                    style={{ backgroundColor: chartPalette.emerald }}
                  >
                    {(Agent?.workHoursToday || 0).toFixed(1)} hr Active Today
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action */}
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF Report
                </>
              )}
            </Button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Calls", val: totalCallsDashboard, icon: Phone, color: "text-emerald-500" },
              { title: "Success Rate", val: `${successRate}%`, icon: TrendingUp, color: "text-blue-500" },
              { title: "Avg Duration", val: `${Agent?.stats?.avg_duration_seconds || 0}s`, icon: Clock, color: "text-amber-500" },
              { title: "Active Hours", val: `${(Agent?.stats?.total_session_time_seconds || 0)/3600}hr`, icon: Target, color: "text-indigo-500" },
            ].map((item, i) => (
              <Card key={i} className="w-full shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">{item.title}</CardTitle>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{item.val}</div>
                </CardContent>
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
                    <div
                      className="text-2xl font-bold"
                      style={{ color: isUrgent ? '#e11d48' : '#1e293b' }}
                    >
                      {item.val}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <Card className="md:col-span-2 lg:col-span-2 shadow-sm border-slate-100 flex flex-col">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Call Trends</CardTitle>
                <CardDescription>Daily call durations tracking.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[320px] w-full pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
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
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend
                        content={(props: any) => {
                          const { payload } = props;
                          return (
                            <div className="grid grid-cols-2 gap-y-2 gap-x-6 mx-auto w-fit mt-4">
                              {payload?.map((entry: any, index: number) => (
                                <div key={`item-${index}`} className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <Card className="shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Agent vs. Team Average</CardTitle>
                <CardDescription>How this agent stacks up across key metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={benchmarkData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar name={Agent.name || "Agent"} dataKey="agent" stroke={chartPalette.dial} fill={chartPalette.dial} fillOpacity={0.35} />
                      <Radar name="Team Avg" dataKey="team" stroke={chartPalette.convert} fill={chartPalette.convert} fillOpacity={0.2} />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

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
                                  <span
                                    className={`text-[10px] sm:text-xs font-bold ${
                                      intensity > 0.45 ? "text-white" : "text-slate-600"
                                    }`}
                                  >
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
          </div>

          <Card className="shadow-sm border-slate-100">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <Card className="md:col-span-2 shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Calls by Project</CardTitle>
                <CardDescription>Active campaigns and their daily volume.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="calls" fill={chartPalette.emerald} radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Pending Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[280px]">
                {followUps.map(f => {
                  const isOverdue = new Date(f.nextDial) < new Date("2026-07-06")
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
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-100 mt-6">
            <CardHeader className="flex flex-col gap-5 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Call Detail Records</CardTitle>
                  <CardDescription>Search logs by client name or phone number.</CardDescription>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                  <Input
                    placeholder="Search by client name or number..."
                    className="w-full md:w-[250px] h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handlePresetDateChange("Today")}>Today</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handlePresetDateChange("Past Week")}>Past Week</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handlePresetDateChange("Past Month")}>Past Month</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-200" onClick={() => handlePresetDateChange("Past Year")}>Past Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex items-center w-full sm:w-auto">
                    <input
                      type="date"
                      onChange={handleDateChange}
                      className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-slate-100 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      title="Select a specific date"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                  <Button onClick={exportToCSV} variant="default" className="h-9 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="block w-full overflow-x-auto">
                <Table className="min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 sm:pl-6">Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="pr-4 sm:pr-6">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecords.length > 0 ? displayRecords.map(log => {
                      const dateObj = log.time ? new Date(log.time) : new Date();

                      return(
                      <TableRow key={log.id} className="hover:bg-slate-50/55">
                        <TableCell className="pl-4 sm:pl-6 font-medium whitespace-nowrap">
                          {dateObj.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-500">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-slate-700">
                           {log.project_id ? (projectDetails[log.project_id] || `Project #${log.project_id}`) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="border-none text-white text-xs font-semibold py-0.5 capitalize"
                            style={{backgroundColor: getStatusColor(log.status)}}
                          >
                            {(log.status || "Unknown").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{log.duration}s</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{ownerDetails[log.owner_id]?.name || `Owner #${log.owner_id}`}</span>
                          <br/>
                          <span className="text-xs text-muted-foreground">{ownerDetails[log.owner_id]?.phone || ""}</span>                        </TableCell>
                        <TableCell className="max-w-xs truncate pr-4 sm:pr-6 text-slate-600">{log.agent_notes || "—"}</TableCell>
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

            <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border p-4 sm:p-6">
              <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
                Showing <strong>{totalRecords === 0 ? 0 : ((currentPage - 1) * 10) + 1}</strong> to <strong>{Math.min(currentPage * 10, totalRecords)}</strong> of <strong>{totalRecords}</strong> calls
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="text-sm font-medium px-2 whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* Invisible PDF Render Target */}
      <div
        style={{ position: "fixed", left: "-9999px", top: "0px" }}
        aria-hidden="true"
      >
        <div ref={reportRef}>
          <AgentReport data={{
              agentInfo: Agent,
              kpis: {
                  totalCalls: totalCallsDashboard,
                  successRate: successRate,
                  avgDuration: `${Agent?.stats?.avg_duration_seconds || 0}s`,
                  activeHours: `${(Agent?.workHoursToday || 0).toFixed(1)}hr`,
                  connectRate: realConnectRate,
                  avgAttemptsToClose: avgAttemptsToClose,
                  overdueCount: overdueCount
              },
              trendData: weeklyChartData,
              statusData: calls,
              projectData: projects,
              benchmarkData,
              funnelData,
              heatmapHours,
              heatmapDays,
              heatmapData,
              heatmapMax
          }} />
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  )
}