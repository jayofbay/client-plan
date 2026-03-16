import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

// ─── DATA ────────────────────────────────────────────────────────────────────

const THREAD_ID = new URLSearchParams(window.location.search).get("client") || "jordan-blake";

const CLIENT = {
  name: "Jordan Blake", avatar: "JB", goal: "Fat Loss", phase: "Cut",
  coach: "Alex Rivera",
  watch: "Apple Watch Series 9", connected: true,
  weight: 89.4, startWeight: 102, targetWeight: 78,
  bodyFat: 24.1, startBodyFat: 31, targetBodyFat: 15,
  weekNum: 8, totalWeeks: 16,
  compliance: 91, streak: 12,
  accent: "#FF4D00",
  stats: { calories: 2100, protein: 185, steps: 9840, sleep: 7.2, water: 2.8 },
  measurements: { chest: 102, waist: 88, hips: 105, arms: 38, thighs: 62 },
  weightHistory: [102, 100.5, 99.1, 97.8, 96.4, 95.0, 93.6, 92.2, 91.0, 89.8, 89.4],
  sessions: [
    { day: "MON", type: "strength", label: "Push A", status: "done",
      exercises: [
        { name: "Bench Press", sets: "4×8", weight: "80kg", done: true, actual: "80kg×8,8,7,7" },
        { name: "Incline DB Press", sets: "3×10", weight: "30kg", done: true, actual: "30kg×10,10,9" },
        { name: "Cable Fly", sets: "3×12", weight: "15kg", done: true, actual: "15kg×12,12,11" },
        { name: "Tricep Pushdown", sets: "3×15", weight: "25kg", done: true, actual: "25kg×15,14,13" },
        { name: "Lateral Raises", sets: "4×15", weight: "10kg", done: true, actual: "10kg×15,15,15,14" },
      ]},
    { day: "TUE", type: "cardio", label: "HIIT 30", status: "done",
      exercises: [
        { name: "Treadmill Sprint Intervals", sets: "10×30s", weight: "16km/h", done: true, actual: "Completed" },
        { name: "Jump Rope", sets: "5×1min", weight: "—", done: true, actual: "Completed" },
        { name: "Battle Ropes", sets: "4×30s", weight: "—", done: true, actual: "Completed" },
      ]},
    { day: "WED", type: "strength", label: "Pull A", status: "done",
      exercises: [
        { name: "Deadlift", sets: "4×5", weight: "120kg", done: true, actual: "120kg×5,5,5,4" },
        { name: "Pull-Ups", sets: "4×8", weight: "BW", done: true, actual: "BW×8,7,6,6" },
        { name: "Seated Row", sets: "3×10", weight: "70kg", done: true, actual: "70kg×10,10,9" },
        { name: "Face Pulls", sets: "3×15", weight: "20kg", done: true, actual: "20kg×15,15,14" },
        { name: "Hammer Curls", sets: "3×12", weight: "20kg", done: true, actual: "20kg×12,12,11" },
      ]},
    { day: "THU", type: "rest", label: "Active Recovery", status: "done",
      exercises: [
        { name: "Light Walk", sets: "30min", weight: "—", done: true, actual: "Completed" },
        { name: "Foam Rolling", sets: "15min", weight: "—", done: true, actual: "Completed" },
      ]},
    { day: "FRI", type: "strength", label: "Legs A", status: "today",
      exercises: [
        { name: "Squat", sets: "4×8", weight: "100kg", done: false, actual: "" },
        { name: "Romanian Deadlift", sets: "3×10", weight: "80kg", done: false, actual: "" },
        { name: "Leg Press", sets: "3×12", weight: "160kg", done: false, actual: "" },
        { name: "Leg Curl", sets: "3×12", weight: "45kg", done: false, actual: "" },
        { name: "Calf Raises", sets: "4×20", weight: "60kg", done: false, actual: "" },
      ]},
    { day: "SAT", type: "cardio", label: "LISS 45", status: "upcoming",
      exercises: [
        { name: "Incline Walk", sets: "45min", weight: "5km/h", done: false, actual: "" },
      ]},
    { day: "SUN", type: "rest", label: "Rest Day", status: "upcoming",
      exercises: [] },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, glow }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", height: 6 }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: 99,
        background: color,
        boxShadow: glow ? `0 0 8px ${color}99` : "none",
        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function WeightChart({ history, accent }) {
  const w = 280, h = 90, pad = 12;
  const min = Math.min(...history) - 2;
  const max = Math.max(...history) + 2;
  const pts = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cg)" />
      <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3}
          fill={i === pts.length - 1 ? accent : "rgba(255,255,255,0.3)"}
          stroke={i === pts.length - 1 ? "#fff" : "none"} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("today");
  const [sessions, setSessions] = useState(CLIENT.sessions);
  const [activeDay, setActiveDay] = useState("FRI");
  const [notification, setNotification] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [tick, setTick] = useState(0);
  const [logModal, setLogModal] = useState(false);
  const [logEntry, setLogEntry] = useState({ weight: "", bodyFat: "" });
  const [clientData, setClientData] = useState(CLIENT);
  const [foodPhotos, setFoodPhotos] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [progressPhotos, setProgressPhotos] = useState({ front: null, left: null, back: null, right: null });
  const [progressUploading, setProgressUploading] = useState({ front: false, left: false, back: false, right: false });
  const progressFileInputRef = useRef(null);
  const [selectedProgressAngle, setSelectedProgressAngle] = useState(null);

  const accent = clientData.accent;
  const todaySession = sessions.find(s => s.status === "today");
  const todayIdx = sessions.findIndex(s => s.status === "today");

  // ── Fetch client profile from Supabase + real-time week updates ──────────
  function applyClientRow(data) {
    setClientData(prev => ({
      ...prev,
      name: data.name,
      avatar: data.avatar,
      goal: data.goal,
      phase: data.phase,
      accent: data.accent_color || CLIENT.accent,
      watch: data.watch || prev.watch,
      connected: data.connected ?? prev.connected,
      weight: data.weight ?? prev.weight,
      startWeight: data.start_weight ?? prev.startWeight,
      targetWeight: data.target_weight ?? prev.targetWeight,
      bodyFat: data.body_fat ?? prev.bodyFat,
      startBodyFat: data.start_body_fat ?? prev.startBodyFat,
      targetBodyFat: data.target_body_fat ?? prev.targetBodyFat,
      weekNum: data.week_num ?? prev.weekNum,
      totalWeeks: data.total_weeks ?? prev.totalWeeks,
      compliance: data.compliance ?? prev.compliance,
      streak: data.streak ?? prev.streak,
    }));
  }

  useEffect(() => {
    supabase.from("clients").select("*").eq("thread_id", THREAD_ID).single()
      .then(({ data }) => { if (data) applyClientRow(data); });

    const channel = supabase
      .channel("client-profile-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "clients", filter: `thread_id=eq.${THREAD_ID}` },
        (payload) => { if (payload.new) applyClientRow(payload.new); })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Live watch tick ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // ── Messaging: initial fetch + real-time subscription ─────────────────────
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", THREAD_ID)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setMessages(data.map(normaliseMessage));
      }
    }
    fetchMessages();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${THREAD_ID}`,
        },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates if optimistic insert already present
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, normaliseMessage(payload.new)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Progress photos: fetch latest per angle on mount ──────────────────────
  useEffect(() => {
    async function fetchProgressPhotos() {
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("thread_id", THREAD_ID)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const grouped = { front: null, left: null, back: null, right: null };
        for (const row of data) {
          if (grouped[row.angle] === null) {
            grouped[row.angle] = row;
          }
        }
        setProgressPhotos(grouped);
      }
    }
    fetchProgressPhotos();
  }, []);

  // ── Food photos: fetch last 5 on mount ────────────────────────────────────
  useEffect(() => {
    async function fetchFoodPhotos() {
      const { data, error } = await supabase
        .from("food_photo_logs")
        .select("*")
        .eq("thread_id", THREAD_ID)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!error && data) {
        setFoodPhotos(data);
      }
    }
    fetchFoodPhotos();
  }, []);

  // Normalise DB row → UI shape
  function normaliseMessage(row) {
    return {
      id: row.id,
      from: row.sender === "coach" ? "coach" : "client",
      time: formatMsgTime(row.created_at),
      text: row.content,
    };
  }

  function formatMsgTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  }

  const liveStats = {
    calories: clientData.stats.calories + Math.floor(Math.sin(tick * 0.7) * 45),
    protein: clientData.stats.protein + Math.floor(Math.sin(tick * 0.5) * 3),
    steps: clientData.stats.steps + Math.floor(tick * 12),
    sleep: clientData.stats.sleep,
    water: clientData.stats.water,
  };

  function notify(msg, type = "success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  }

  // ── Exercise toggle with Supabase upsert ──────────────────────────────────
  async function toggleExercise(dayIdx, exIdx) {
    const session = sessions[dayIdx];
    const exercise = session.exercises[exIdx];
    const newDone = !exercise.done;

    // Update local state immediately for responsive UI
    setSessions(prev => prev.map((s, si) => {
      if (si !== dayIdx) return s;
      const exercises = s.exercises.map((e, ei) =>
        ei === exIdx ? { ...e, done: newDone } : e
      );
      return { ...s, exercises };
    }));

    // Persist to Supabase
    const { error } = await supabase
      .from("exercise_logs")
      .upsert(
        {
          thread_id: THREAD_ID,
          session_day: session.day,
          exercise_name: exercise.name,
          done: newDone,
          week_number: clientData.weekNum,
          logged_at: new Date().toISOString(),
        },
        { onConflict: "thread_id,session_day,exercise_name,week_number" }
      );

    if (error) {
      console.error("exercise_logs upsert error:", error);
    }
  }

  // ── Send message to Supabase ───────────────────────────────────────────────
  async function sendMessage() {
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");

    const { error } = await supabase.from("messages").insert({
      thread_id: THREAD_ID,
      sender: "client",
      content: text,
    });

    if (error) {
      console.error("messages insert error:", error);
      notify("Failed to send message", "error");
    }
    // Real-time subscription will pick up the new row and update state
  }

  // ── Log measurement to Supabase ────────────────────────────────────────────
  async function logMeasurement() {
    if (!logEntry.weight) { notify("Enter your weight to log", "error"); return; }

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("progress_logs").insert({
      thread_id: THREAD_ID,
      logged_date: today,
      weight_kg: parseFloat(logEntry.weight),
      body_fat_pct: logEntry.bodyFat ? parseFloat(logEntry.bodyFat) : null,
      notes: null,
    });

    if (error) {
      console.error("progress_logs insert error:", error);
      notify("Failed to save progress", "error");
      return;
    }

    notify("Progress logged! Great work 💪");
    setLogModal(false);
    setLogEntry({ weight: "", bodyFat: "" });
  }

  // ── Progress photo upload ──────────────────────────────────────────────────
  async function uploadProgressPhoto(angle, file) {
    setProgressUploading(prev => ({ ...prev, [angle]: true }));
    try {
      const today = new Date().toISOString().split("T")[0];
      const uuid = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `jordan-blake/progress/${today}/${angle}-${uuid}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("progress photo upload error:", uploadError);
        notify("Progress photo upload failed", "error");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl ?? "";

      const { data: logRow, error: insertError } = await supabase
        .from("progress_photos")
        .insert({
          thread_id: THREAD_ID,
          angle,
          storage_path: storagePath,
          public_url: publicUrl,
          logged_date: today,
        })
        .select()
        .single();

      if (insertError) {
        console.error("progress_photos insert error:", insertError);
        notify("Photo saved but log failed", "error");
        return;
      }

      setProgressPhotos(prev => ({ ...prev, [angle]: logRow }));
      notify("Progress photo saved!");
    } catch (err) {
      console.error("uploadProgressPhoto unexpected error:", err);
      notify("Unexpected error uploading photo", "error");
    } finally {
      setProgressUploading(prev => ({ ...prev, [angle]: false }));
    }
  }

  function handleProgressFileSelect(e) {
    const file = e.target.files?.[0];
    const angle = selectedProgressAngle;
    e.target.value = "";
    if (!file || !angle) return;
    uploadProgressPhoto(angle, file);
  }

  // ── Food photo upload ──────────────────────────────────────────────────────
  async function handleFoodPhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be selected again if needed
    e.target.value = "";

    setPhotoUploading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const uuid = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `jordan-blake/${today}/${uuid}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("food-photos")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("storage upload error:", uploadError);
        notify("Photo upload failed", "error");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("food-photos")
        .getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl ?? "";

      // Insert row to food_photo_logs
      const { data: logRow, error: insertError } = await supabase
        .from("food_photo_logs")
        .insert({
          thread_id: THREAD_ID,
          storage_path: storagePath,
          public_url: publicUrl,
          caption: null,
          meal_type: null,
          coach_seen: false,
          logged_date: today,
        })
        .select()
        .single();

      if (insertError) {
        console.error("food_photo_logs insert error:", insertError);
        notify("Photo saved to storage but log failed", "error");
        return;
      }

      // Prepend to local state (keep last 5)
      setFoodPhotos(prev => [logRow, ...prev].slice(0, 5));
      notify("Food photo logged!");
    } catch (err) {
      console.error("handleFoodPhotoSelect unexpected error:", err);
      notify("Unexpected error uploading photo", "error");
    } finally {
      setPhotoUploading(false);
    }
  }

  const todayDone = todaySession ? todaySession.exercises.filter(e => e.done).length : 0;
  const todayTotal = todaySession ? todaySession.exercises.length : 0;
  const weekDone = sessions.filter(s => s.status === "done").length;

  const S = {
    shell: {
      width: 390, maxHeight: 844, minHeight: 500,
      margin: "0 auto", background: "#0A0A0A",
      borderRadius: 48, overflow: "hidden",
      boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Barlow', system-ui, sans-serif",
      position: "relative",
    },
    statusBar: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 28px 0",
      fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)",
      letterSpacing: 0.3, flexShrink: 0,
    },
    scroll: {
      flex: 1, overflowY: "auto", padding: "0 0 90px",
      scrollbarWidth: "none",
    },
    header: {
      padding: "20px 20px 0",
      display: "flex", flexDirection: "column", gap: 4,
    },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: "16px",
      margin: "0 16px 12px",
    },
    tabBar: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "rgba(10,10,10,0.95)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", padding: "10px 0 24px",
      flexShrink: 0,
    },
    tab: (active) => ({
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      cursor: "pointer", opacity: active ? 1 : 0.35,
      transition: "opacity 0.2s",
      fontSize: 10, fontWeight: 600, color: active ? accent : "#fff",
      letterSpacing: 0.5, textTransform: "uppercase",
    }),
    pill: (bg) => ({
      display: "inline-flex", alignItems: "center",
      background: bg || "rgba(255,255,255,0.08)",
      borderRadius: 99, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, color: "#fff",
      letterSpacing: 0.5,
    }),
  };

  const typeColor = (type) =>
    type === "strength" ? accent : type === "cardio" ? "#00C896" : "#6B7280";
  const typeLabel = (type) =>
    type === "strength" ? "Strength" : type === "cardio" ? "Cardio" : "Rest";

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Determine the last coach message for the "Note from coach" card
  const lastCoachMsg = [...messages].reverse().find(m => m.from === "coach");
  const noteFromCoach = lastCoachMsg
    ? lastCoachMsg.text
    : "Today is Legs A. You've got Squats, RDLs, Leg Press, Leg Curl, and Calf Raises. Warm up well and film your squat if you can — want to check your depth. You've got this 💪";

  function TodayView() {
    return (
      <>
        {/* Hidden file input for food photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFoodPhotoSelect}
        />

        <div style={S.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: 0.3 }}>
                <button onClick={() => setClientData(p => ({ ...p, weekNum: Math.max(1, p.weekNum - 1) }))} style={{ background: "none", border: "none", color: clientData.weekNum <= 1 ? "rgba(255,255,255,0.15)" : accent, fontSize: 18, padding: 0, lineHeight: 1, cursor: "pointer" }}>‹</button>
                WEEK {clientData.weekNum} OF {clientData.totalWeeks} · {clientData.phase.toUpperCase()}
                <button onClick={() => setClientData(p => ({ ...p, weekNum: Math.min(p.totalWeeks, p.weekNum + 1) }))} style={{ background: "none", border: "none", color: clientData.weekNum >= clientData.totalWeeks ? "rgba(255,255,255,0.15)" : accent, fontSize: 18, padding: 0, lineHeight: 1, cursor: "pointer" }}>›</button>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 2, letterSpacing: -0.5 }}>
                Good morning,<br />{clientData.name.split(' ')[0]} 👋
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `${accent}22`, border: `1.5px solid ${accent}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: accent,
            }}>{clientData.avatar}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "14px 20px 4px", flexWrap: "wrap" }}>
          <span style={S.pill(`${accent}22`)}>
            <span style={{ color: accent, marginRight: 4 }}>🔥</span>
            <span style={{ color: accent }}>{clientData.streak} day streak</span>
          </span>
          <span style={S.pill("rgba(0,200,150,0.15)")}>
            <span style={{ color: "#00C896" }}>✓ {clientData.compliance}% compliance</span>
          </span>
          <span style={S.pill()}>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{weekDone}/7 done</span>
          </span>
        </div>

        {todaySession && (
          <div style={{ ...S.card, border: `1px solid ${accent}33`, background: `${accent}0A` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  Today · {todaySession.day}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                  {todaySession.label}
                </div>
              </div>
              <span style={S.pill(`${accent}22`)}>
                <span style={{ color: accent }}>{typeLabel(todaySession.type)}</span>
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Exercises completed</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{todayDone}/{todayTotal}</span>
              </div>
              <ProgressBar value={todayDone} max={todayTotal} color={accent} glow />
            </div>

            {todaySession.exercises.map((ex, ei) => (
              <div key={ei} onClick={() => toggleExercise(todayIdx, ei)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: ei < todaySession.exercises.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  cursor: "pointer",
                }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  border: ex.done ? "none" : `1.5px solid rgba(255,255,255,0.2)`,
                  background: ex.done ? accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s",
                }}>
                  {ex.done && <span style={{ fontSize: 12, color: "#fff" }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: ex.done ? "rgba(255,255,255,0.4)" : "#fff",
                    textDecoration: ex.done ? "line-through" : "none", transition: "all 0.2s",
                  }}>
                    {ex.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                    {ex.sets} · {ex.weight}
                  </div>
                </div>
              </div>
            ))}

            {todayDone === todayTotal && todayTotal > 0 && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "rgba(0,200,150,0.12)", borderRadius: 12,
                border: "1px solid rgba(0,200,150,0.2)",
                fontSize: 13, fontWeight: 700, color: "#00C896", textAlign: "center",
              }}>
                Session complete! Awesome work 🎉
              </div>
            )}
          </div>
        )}

        {clientData.connected && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Live from {clientData.watch}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#00C896",
                  boxShadow: "0 0 6px #00C896", animation: "pulse 2s infinite",
                }} />
                <span style={{ fontSize: 11, color: "#00C896", fontWeight: 600 }}>LIVE</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Calories", value: liveStats.calories, unit: "kcal", icon: "🔥" },
                { label: "Protein", value: liveStats.protein, unit: "g", icon: "🥩" },
                { label: "Steps", value: liveStats.steps.toLocaleString(), unit: "", icon: "👟" },
                { label: "Sleep", value: liveStats.sleep, unit: "h", icon: "😴" },
                { label: "Water", value: liveStats.water, unit: "L", icon: "💧" },
                { label: "Goal", value: clientData.goal, unit: "", icon: "🎯" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 12,
                  padding: "10px 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 18 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 3 }}>
                    {s.value}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.unit}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Food photo button below live stats card */}
            <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                style={{
                  width: "100%", background: photoUploading ? "rgba(255,255,255,0.04)" : "rgba(255,77,0,0.12)",
                  border: `1px solid ${photoUploading ? "rgba(255,255,255,0.08)" : `${accent}44`}`,
                  borderRadius: 12, padding: "10px 14px",
                  color: photoUploading ? "rgba(255,255,255,0.35)" : accent,
                  fontSize: 13, fontWeight: 700, cursor: photoUploading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit", transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 16 }}>📷</span>
                {photoUploading ? "Uploading..." : "+ Photo  Log Food"}
              </button>
            </div>
          </div>
        )}

        {/* Food Log section */}
        {foodPhotos.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Food Log</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {foodPhotos.map((photo, i) => (
                <div key={photo.id ?? i} style={{ flexShrink: 0, position: "relative" }}>
                  <img
                    src={photo.public_url}
                    alt={photo.caption || `Food ${i + 1}`}
                    style={{
                      width: 72, height: 72, borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  {photo.meal_type && (
                    <div style={{
                      position: "absolute", bottom: 4, left: 0, right: 0,
                      textAlign: "center", fontSize: 9, fontWeight: 700,
                      color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {photo.meal_type}
                    </div>
                  )}
                  {photo.coach_seen && (
                    <div style={{
                      position: "absolute", top: 4, right: 4,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "#00C896",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, color: "#fff", fontWeight: 700,
                    }}>✓</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
              {foodPhotos.length} recent photo{foodPhotos.length !== 1 ? "s" : ""} · tap + Photo to add more
            </div>
          </div>
        )}

        <div style={{ ...S.card, background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.15)" }}>
          <div style={{ fontSize: 11, color: "#818CF8", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            NOTE FROM COACH
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            "{noteFromCoach}"
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            — {clientData.coach}
          </div>
        </div>
      </>
    );
  }

  function WeekView() {
    const statusColor = (s) => s === "done" ? "#00C896" : s === "today" ? accent : "rgba(255,255,255,0.2)";
    const statusLabel = (s) => s === "done" ? "Done" : s === "today" ? "Today" : "Upcoming";

    return (
      <>
        <div style={S.header}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Week {clientData.weekNum}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Schedule</div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 16px 4px", overflowX: "auto" }}>
          {sessions.map((s, i) => (
            <div key={i} onClick={() => setActiveDay(activeDay === s.day ? null : s.day)}
              style={{ flexShrink: 0, width: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 0.5 }}>{s.day}</div>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: activeDay === s.day ? typeColor(s.type) : "rgba(255,255,255,0.06)",
                border: s.status === "today" ? `2px solid ${accent}` : "1.5px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s",
              }}>
                {s.type === "strength" ? "💪" : s.type === "cardio" ? "🏃" : "😴"}
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(s.status) }} />
            </div>
          ))}
        </div>

        {sessions.map((s, si) => {
          const isActive = activeDay === s.day;
          const doneCt = s.exercises.filter(e => e.done).length;
          return (
            <div key={si} onClick={() => setActiveDay(isActive ? null : s.day)}
              style={{
                ...S.card,
                border: isActive ? `1px solid ${typeColor(s.type)}44` : "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${typeColor(s.type)}18`, border: `1px solid ${typeColor(s.type)}33`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {s.type === "strength" ? "💪" : s.type === "cardio" ? "🏃" : "😴"}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{s.day} · {s.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{typeLabel(s.type)}</div>
                  </div>
                </div>
                <span style={{ ...S.pill(), background: `${statusColor(s.status)}22`, color: statusColor(s.status), fontSize: 11 }}>
                  {statusLabel(s.status)}
                </span>
              </div>

              {isActive && s.exercises.length > 0 && (
                <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                  {s.exercises.map((ex, ei) => (
                    <div key={ei}
                      onClick={e => { e.stopPropagation(); if (s.status === "today") toggleExercise(si, ei); }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 0",
                        borderBottom: ei < s.exercises.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        cursor: s.status === "today" ? "pointer" : "default",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {s.status === "today" && (
                          <div style={{
                            width: 20, height: 20, borderRadius: 6,
                            border: ex.done ? "none" : `1.5px solid rgba(255,255,255,0.2)`,
                            background: ex.done ? accent : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            {ex.done && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
                          </div>
                        )}
                        {s.status === "done" && (
                          <div style={{
                            width: 20, height: 20, borderRadius: 6,
                            background: "rgba(0,200,150,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: 10, color: "#00C896" }}>✓</span>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: s.status === "done" ? "rgba(255,255,255,0.5)" : "#fff" }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{ex.sets} · {ex.weight}</div>
                        </div>
                      </div>
                      {ex.actual && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", maxWidth: 90, textAlign: "right" }}>
                          {ex.actual}
                        </span>
                      )}
                    </div>
                  ))}
                  {s.status === "today" && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Progress</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{doneCt}/{s.exercises.length}</span>
                      </div>
                      <ProgressBar value={doneCt} max={s.exercises.length} color={accent} glow />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  function ProgressView() {
    const weightLost = clientData.startWeight - clientData.weight;
    const weightLeft = clientData.weight - clientData.targetWeight;
    const overallPct = Math.round(((clientData.startWeight - clientData.weight) / (clientData.startWeight - clientData.targetWeight)) * 100);
    const bfLost = clientData.startBodyFat - clientData.bodyFat;

    const angles = [
      { key: "front", label: "Front" },
      { key: "back", label: "Back" },
      { key: "left", label: "Left" },
      { key: "right", label: "Right" },
    ];

    const latestPhotoDate = Object.values(progressPhotos)
      .filter(Boolean)
      .map(p => p.logged_date)
      .sort()
      .reverse()[0] ?? null;

    return (
      <>
        {/* Hidden file input for progress photo upload */}
        <input
          ref={progressFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleProgressFileSelect}
        />

        <div style={S.header}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Week {clientData.weekNum} of {clientData.totalWeeks}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>My Progress</div>
            <button onClick={() => setLogModal(true)} style={{
              background: accent, border: "none", borderRadius: 10,
              padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Log</button>
          </div>
        </div>

        {/* Progress Photos card */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Progress Photos</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {angles.map(({ key, label }) => {
              const photo = progressPhotos[key];
              const uploading = progressUploading[key];
              return (
                <div
                  key={key}
                  onClick={() => {
                    if (!photo && !uploading) {
                      setSelectedProgressAngle(key);
                      progressFileInputRef.current?.click();
                    }
                  }}
                  style={{
                    flex: 1,
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    position: "relative",
                    cursor: photo || uploading ? "default" : "pointer",
                    border: photo ? "none" : `1.5px dashed ${accent}66`,
                    background: photo ? "transparent" : `${accent}0A`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.public_url}
                        alt={label}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "rgba(0,0,0,0.55)",
                        padding: "4px 6px",
                        textAlign: "center",
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        textTransform: "uppercase", letterSpacing: 0.5,
                      }}>
                        {label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, color: accent, fontWeight: 300, lineHeight: 1 }}>+</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {label}
                      </div>
                    </>
                  )}

                  {/* Loading overlay */}
                  {uploading && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 12,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: accent }}>Uploading…</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {latestPhotoDate && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              Latest photo: {latestPhotoDate}
            </div>
          )}
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                Current Weight
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>
                {clientData.weight}<span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>kg</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Lost</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#00C896" }}>−{weightLost.toFixed(1)}kg</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{weightLeft.toFixed(1)}kg to go</div>
            </div>
          </div>
          <WeightChart history={clientData.weightHistory} accent={accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Start: {clientData.startWeight}kg</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Target: {clientData.targetWeight}kg</span>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Overall Progress</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{overallPct}%</div>
          </div>
          <ProgressBar value={overallPct} max={100} color={accent} glow />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
            Week {clientData.weekNum} of {clientData.totalWeeks} · {clientData.goal} phase
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Body Fat %</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{clientData.bodyFat}%</div>
              <div style={{ fontSize: 12, color: "#00C896", marginTop: 2 }}>−{bfLost.toFixed(1)}% from start</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Target</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{clientData.targetBodyFat}%</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "Essential", range: "10-13%", color: "#818CF8" },
              { label: "Athletic", range: "14-17%", color: "#00C896" },
              { label: "Fitness", range: "18-24%", color: accent },
              { label: "Average", range: "25%+", color: "#6B7280" },
            ].map((z, i) => (
              <div key={i} style={{
                flex: 1, background: `${z.color}18`, border: `1px solid ${z.color}33`,
                borderRadius: 8, padding: "6px 4px", textAlign: "center",
                outline: i === 2 ? `1.5px solid ${z.color}` : "none",
              }}>
                <div style={{ fontSize: 9, color: z.color, fontWeight: 700, letterSpacing: 0.5 }}>{z.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{z.range}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Measurements (cm)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(clientData.measurements).map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize", letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>
                  {v}<span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function CoachView() {
    return (
      <>
        <div style={S.header}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Messages
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#818CF8",
            }}>AR</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{clientData.coach}</div>
              <div style={{ fontSize: 11, color: "#00C896", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00C896" }} />
                Online
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
              No messages yet — say hi to your coach!
            </div>
          )}
          {messages.map((m) => {
            const isCoach = m.from === "coach";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isCoach ? "flex-start" : "flex-end" }}>
                <div style={{
                  maxWidth: "82%",
                  background: isCoach ? "rgba(255,255,255,0.06)" : `${accent}22`,
                  border: isCoach ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${accent}33`,
                  borderRadius: isCoach ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.5 }}>{m.text}</div>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
                  {isCoach ? clientData.coach : "You"} · {m.time}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ margin: "0 16px 12px", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <input
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Message your coach…"
            style={{
              flex: 1, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "10px 14px",
              color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={sendMessage} style={{
            width: 38, height: 38, borderRadius: 12,
            background: messageInput.trim() ? accent : "rgba(255,255,255,0.06)",
            border: "none", cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, transition: "background 0.2s",
          }}>↑</button>
        </div>
      </>
    );
  }

  const tabs = [
    { id: "today", label: "Today", icon: "🏠" },
    { id: "week", label: "Week", icon: "📅" },
    { id: "progress", label: "Progress", icon: "📈" },
    { id: "coach", label: "Coach", icon: "💬" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {notification && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: notification.type === "success" ? "rgba(0,200,150,0.95)" : "rgba(255,140,66,0.95)",
          color: "#fff", borderRadius: 12, padding: "10px 18px",
          fontSize: 13, fontWeight: 700, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeUp 0.3s ease",
        }}>{notification.msg}</div>
      )}

      {logModal && (
        <div onClick={() => setLogModal(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 9998, backdropFilter: "blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 390, background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px 24px 0 0", padding: "24px 20px 40px",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Log Progress</div>
            {[
              { label: "Weight (kg)", key: "weight", placeholder: "e.g. 89.0" },
              { label: "Body Fat % (optional)", key: "bodyFat", placeholder: "e.g. 23.8" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
                <input
                  value={logEntry[f.key]}
                  onChange={e => setLogEntry(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "10px 14px",
                    color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
            ))}
            <button onClick={logMeasurement} style={{
              width: "100%", background: accent, border: "none",
              borderRadius: 14, padding: "14px", color: "#fff",
              fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 8,
            }}>Save Entry</button>
          </div>
        </div>
      )}

      <div style={S.shell}>
        <div style={S.statusBar}>
          <span>{timeStr}</span>
          <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11 }}>
            <span>●●●</span><span>WiFi</span><span>⬛</span>
          </div>
        </div>

        <div style={S.scroll}>
          {view === "today" && <TodayView />}
          {view === "week" && <WeekView />}
          {view === "progress" && <ProgressView />}
          {view === "coach" && <CoachView />}
        </div>

        <div style={S.tabBar}>
          {tabs.map(t => (
            <div key={t.id} style={S.tab(view === t.id)} onClick={() => setView(t.id)}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
              {view === t.id && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: accent, marginTop: 1 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
