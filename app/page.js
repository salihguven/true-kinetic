// app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth, db, ADMIN_EMAILS } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  FolderGit2,
  CheckSquare,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Megaphone,
  X,
  LogOut,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Clock,
  ExternalLink,
  Link2,
  Code2,
  Box,
  Hammer,
  Film,
  Layout,
  Sparkles,
  Volume2,
  FileText,
  XCircle,
  ShieldBan,
  RefreshCw,
  Info,
  AlertTriangle,
  FileCheck,
  Music,
  Crown,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  LayoutDashboard,
  Sparkle,
  EyeOff,
  Bot,
  Send,
  Loader2
} from "lucide-react";

const DISCORD_TASK_WEBHOOK = "https://discord.com/api/webhooks/1542226540799197275/hTeTL90ikfLAXdlUg2bfZmDAD3yxUuqJRQhvHK4bhcDFp4ADlTiQh_RjRjQ3fzRrzBQ9";

// =========================================================
// 1. HUB DASHBOARD (AI SOHBET ASİSTANLI)
// =========================================================
function HubDashboard({ currentUser, userData, onLogout, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [projectFilter, setProjectFilter] = useState("Tümü");
  const [viewScope, setViewScope] = useState("my");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const [allProjects, setAllProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Modallar
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitAccepted, setCommitAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI CHAT STATE'LERİ
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "model", text: "Merhaba! Ben True Kinetic AI Asistanı. Roblox Luau kodlama, 3D modelleme veya stüdyo projeleri hakkında nasıl yardımcı olabilirim?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const isDark = theme === "dark";

  const workTypes = [
    { name: "Script", icon: Code2 },
    { name: "3D Model", icon: Box },
    { name: "Build", icon: Hammer },
    { name: "Animasyon", icon: Film },
    { name: "Composer / Müzik", icon: Music },
    { name: "UI Tasarım", icon: Layout },
    { name: "VFX", icon: Sparkles },
    { name: "SFX / Ses", icon: Volume2 },
    { name: "Diğer", icon: FileText }
  ];

  const reviewStatuses = {
    "İnceleniyor": {
      name: "İnceleniyor",
      badge: isDark
        ? "bg-amber-950/40 text-amber-400 border-amber-800/60"
        : "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock
    },
    "Onaylandı": {
      name: "Onaylandı",
      badge: isDark
        ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2
    },
    "Kabul Edilmedi": {
      name: "Kabul Edilmedi",
      badge: isDark
        ? "bg-rose-950/40 text-rose-400 border-rose-800/60"
        : "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle
    }
  };

  const priorityOptions = [
    { name: "Normal", color: isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700" },
    { name: "Yüksek", color: isDark ? "bg-amber-950/40 border-amber-800/50 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700" },
    { name: "Kritik", color: isDark ? "bg-rose-950/40 border-rose-800/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700" }
  ];

  const isMasterCEO = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());
  const permissions = isMasterCEO ? {
    canAccessAdmin: true,
    canReviewProjects: true,
    canViewAllProjects: true,
    canApproveUsers: true,
    canModerateUsers: true,
    canPostAnnouncements: true
  } : (userData?.permissions || {});

  const canAssignTasks = isMasterCEO || permissions.canAccessAdmin || permissions.canModerateUsers || permissions.canReviewProjects || permissions.canViewAllProjects;
  const displayRankTitle = isMasterCEO ? "CEO / Kurucu" : (userData?.customTitle || userData?.managementRole || "Ekip Üyesi");

  const [newProject, setNewProject] = useState({
    title: "",
    worker: currentUser?.displayName || "",
    description: "",
    workType: "Script",
    status: "Devam Ediyor",
    reviewStatus: "İnceleniyor",
    workLink: ""
  });

  const [newTask, setNewTask] = useState({
    title: "",
    project: "",
    assignedTo: "",
    assignedToId: "",
    priority: "Normal",
    isPrivate: false
  });

  useEffect(() => {
    const qProjects = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAllProjects(list);
    });

    const qTasks = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTasks(list);
    });

    const qAnnounce = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubAnnounce = onSnapshot(qAnnounce, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAnnouncements(list);
    });

    const qUsers = query(collection(db, "users"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const uList = [];
      snap.forEach((d) => {
        const u = d.data();
        if (u.status === "approved") {
          uList.push({ id: d.id, ...u });
        }
      });
      setTeamMembers(uList);
    });

    return () => {
      unsubProjects();
      unsubTasks();
      unsubAnnounce();
      unsubUsers();
    };
  }, []);

  // AI Mesaj Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // AI SOHBET MESAJI GÖNDERME (GÜNCELLENMİŞ GÜVENLİ FONKSİYON)
// AI SOHBET MESAJI GÖNDERME & İHLAL GÜVENLİK LOGU
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;

    const userText = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: "user", text: userText }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.slice(-6)
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Sunucu Hatası (${res.status})`);
      }

      // KULLANICI KURAL İHLALİ YAPTIYSA (Hakaret, Tehdit, Cinsellik vb.) ADMIN LOGUNA YAZ
      if (data.isViolation) {
        try {
          await addDoc(collection(db, "security_logs"), {
            userId: currentUser.uid,
            userName: currentUser.displayName || "Ekip Üyesi",
            userEmail: currentUser.email,
            message: userText,
            type: "AI_INAPPROPRIATE_CONTENT",
            createdAt: serverTimestamp()
          });
        } catch (logErr) {
          console.error("Güvenlik logu yazılamadı:", logErr);
        }
      }

      setChatMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: `⚠️ ${err.message}` }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePreSubmitProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      alert("Lütfen proje başlığı giriniz.");
      return;
    }
    setCommitAccepted(false);
    setShowCommitModal(true);
  };

  const handleFinalSubmitProject = async () => {
    if (!commitAccepted) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        userId: currentUser.uid,
        userEmail: currentUser.email?.toLowerCase(),
        creator: currentUser?.displayName || currentUser?.email || "Ekip Üyesi",
        createdAt: serverTimestamp(),
        rulesAccepted: true
      });

      setShowCommitModal(false);
      setShowProjectModal(false);
      setNewProject({
        title: "",
        worker: currentUser?.displayName || "",
        description: "",
        workType: "Script",
        status: "Devam Ediyor",
        reviewStatus: "İnceleniyor",
        workLink: ""
      });
      alert("Çalışmanız stüdyo kuralları taahhüdü ile yetkili incelemesine başarıyla gönderildi!");
    } catch (err) {
      alert("Hata oluştu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!canAssignTasks) {
      alert("Görev atama yetkiniz bulunmuyor.");
      return;
    }
    if (!newTask.title.trim()) return;

    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        completed: false,
        creatorId: currentUser.uid,
        creatorName: currentUser?.displayName || "Lider",
        createdAt: serverTimestamp()
      });

      try {
        const embedColor = newTask.priority === "Kritik" ? 0xe11d48 : newTask.priority === "Yüksek" ? 0xf59e0b : 0x3b82f6;
        const payload = {
          username: "True Kinetic Dispatcher",
          avatar_url: "https://cdn-icons-png.flaticon.com/512/906/906343.png",
          embeds: [
            {
              title: "📌 Yeni Stüdyo Görevi Atandı!",
              description: `**Görev:** ${newTask.title}`,
              color: embedColor,
              fields: [
                { name: "👤 Atanan Üye", value: `**${newTask.assignedTo || "Ekip Üyesi"}**`, inline: true },
                { name: "👑 Atayan Yetkili", value: `**${currentUser?.displayName || "Lider"}**`, inline: true },
                { name: "⚡ Öncelik", value: `**${newTask.priority || "Normal"}**`, inline: true },
                { name: "📁 İlgili Proje", value: newTask.project || "Genel Stüdyo", inline: true },
                { name: "🔒 Gizlilik Durumu", value: newTask.isPrivate ? "Özel / Gizli Görev" : "Herkese Açık", inline: true }
              ],
              footer: { text: "True Kinetic Studios • Task Management" },
              timestamp: new Date().toISOString()
            }
          ]
        };

        await fetch(DISCORD_TASK_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (webhookErr) {
        console.error("Discord webhook bildirimi gönderilemedi:", webhookErr);
      }

      setShowTaskModal(false);
      setNewTask({
        title: "",
        project: allProjects[0]?.title || "",
        assignedTo: "",
        assignedToId: "",
        priority: "Normal",
        isPrivate: false
      });
      alert("Görev başarıyla atandı ve Discord sunucusuna bildirildi! 🚀");
    } catch (err) {
      alert("Görev eklenemedi: " + err.message);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { completed: !currentStatus });
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  const displayedProjects = (permissions.canViewAllProjects && viewScope === "all")
    ? allProjects
    : allProjects.filter((p) => p.userId === currentUser.uid || p.userEmail === currentUser.email?.toLowerCase() || p.creator === (currentUser.displayName || currentUser.email));

  const filteredProjects = displayedProjects.filter((p) => {
    if (projectFilter === "Tümü") return true;
    return (p.reviewStatus || "İnceleniyor") === projectFilter;
  });

  const displayedTasks = tasks.filter((t) => {
    if (canAssignTasks) return true;
    if (t.isPrivate) {
      return t.assignedToId === currentUser.uid || t.assignedTo === currentUser.displayName;
    }
    return true;
  });

  const approvedCount = displayedProjects.filter(p => p.reviewStatus === "Onaylandı").length;
  const pendingCount = displayedProjects.filter(p => (p.reviewStatus || "İnceleniyor") === "İnceleniyor").length;
  const rejectedCount = displayedProjects.filter(p => p.reviewStatus === "Kabul Edilmedi").length;

  const hasValidWarning = userData?.warning && userData.warning.trim().length > 1 && userData.warning.trim() !== ".";

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 overflow-x-hidden ${
      isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      {/* SOL DİKEY SIDEBAR */}
      <aside className={`w-64 border-r shrink-0 flex flex-col justify-between p-5 transition-all duration-200 md:flex sticky top-0 h-screen ${
        isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 shadow-2xl flex" : "hidden md:flex"
      } ${
        isDark ? "border-[#1a1d26] bg-[#0d0f14]" : "border-slate-200 bg-white"
      }`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
              }`}>
                TK
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight leading-none">True Kinetic</h2>
                <span className="text-[10px] text-slate-400 font-mono">Studios Hub</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200/80"
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-xs truncate max-w-[130px]">
                {userData?.displayName || currentUser?.email?.split("@")[0]}
              </span>
              {isMasterCEO && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-mono">{userData?.role || "Geliştirici"}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded border uppercase text-[9px] ${
                isDark ? "bg-indigo-950/40 text-indigo-400 border-indigo-800/50" : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}>
                {displayRankTitle}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab("overview"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === "overview"
                  ? (isDark ? "bg-white text-slate-950 shadow-xs" : "bg-slate-900 text-white shadow-xs")
                  : (isDark ? "text-slate-400 hover:bg-[#111318] hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Genel Bakış</span>
            </button>

            <button
              onClick={() => { setActiveTab("projects"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === "projects"
                  ? (isDark ? "bg-white text-slate-950 shadow-xs" : "bg-slate-900 text-white shadow-xs")
                  : (isDark ? "text-slate-400 hover:bg-[#111318] hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4" />
                <span>Projeler & İşler</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">{displayedProjects.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab("tasks"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === "tasks"
                  ? (isDark ? "bg-white text-slate-950 shadow-xs" : "bg-slate-900 text-white shadow-xs")
                  : (isDark ? "text-slate-400 hover:bg-[#111318] hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Görev Listesi</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">{displayedTasks.length}</span>
            </button>

            {/* AI ASİSTANI MENÜ BUTONU */}
            <button
              onClick={() => { setShowAiChat(true); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                isDark
                  ? "bg-indigo-950/20 border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/40"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>Stüdyo AI Asistanı</span>
            </button>

            {permissions.canAccessAdmin && (
              <Link
                href="/admin"
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all mt-3 border ${
                  isDark
                    ? "border-[#1a1d26] bg-[#111318] text-indigo-400 hover:bg-slate-800"
                    : "border-slate-200 bg-slate-50 text-indigo-700 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Yönetim Masası</span>
              </Link>
            )}
          </nav>
        </div>

        <div className={`pt-4 border-t space-y-2 ${isDark ? "border-[#1a1d26]" : "border-slate-200"}`}>
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                isDark ? "bg-[#07080b] border-[#1a1d26] text-amber-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{isDark ? "Açık Mod" : "Koyu Mod"}</span>
            </button>

            <button
              onClick={onLogout}
              className={`p-2 rounded-xl border text-xs text-rose-500 hover:bg-rose-500/10 transition-all ${
                isDark ? "border-[#1a1d26]" : "border-slate-200"
              }`}
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            href="/legal"
            className="block text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors pt-1"
          >
            Yasal Sözleşmeler & Kurallar
          </Link>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className={`md:hidden flex items-center justify-between p-4 border-b ${
          isDark ? "border-[#1a1d26] bg-[#0d0f14]" : "border-slate-200 bg-white"
        }`}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-500/20 text-slate-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-xs">True Kinetic Hub</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAiChat(true)} className="p-1.5 text-indigo-500">
              <Bot className="w-4 h-4" />
            </button>
            <button onClick={toggleTheme} className="p-1.5 text-slate-500">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* KARŞILAMA VE HOŞ GELDİN KARTI */}
          <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden transition-all shadow-xs ${
            isDark
              ? "bg-gradient-to-br from-[#0d0f14] via-[#090b0f] to-[#07080b] border-[#1a1d26]"
              : "bg-gradient-to-br from-white via-slate-50/50 to-slate-100/60 border-slate-200/90"
          }`}>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-2.5 border bg-slate-500/5 border-slate-500/20 text-indigo-500">
                  <Sparkle className="w-3.5 h-3.5 fill-current" />
                  Stüdyo Çalışma Portalı
                </div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Hoş Geldin, {userData?.displayName || currentUser?.displayName || "Geliştirici"} 👋
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Çalışmalarınızı ekleyebilir, onay durumlarını anlık takip edebilir ve stüdyo görevlerinizi tamamlayabilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                    isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <Plus className="w-4 h-4" /> Yeni İş Yükle
                </button>

                {canAssignTasks && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                      isDark ? "bg-[#111318] border-[#1a1d26] text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Ekibe Görev Ata
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GİZLENEBİLİR YÖNETİM UYARISI */}
          {hasValidWarning && !isWarningDismissed && (
            <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3.5 shadow-sm ${
              isDark
                ? "bg-amber-950/30 border-amber-800/60 text-amber-200"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block text-amber-600 dark:text-amber-400">
                    Stüdyo Yönetim Uyarısı
                  </span>
                  <p className="text-xs mt-0.5 leading-relaxed">{userData.warning}</p>
                </div>
              </div>

              <button
                onClick={() => setIsWarningDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Uyarıyı Gizle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DUYURU BANDI */}
          {announcements.length > 0 && (
            <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-xs ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80"
            }`}>
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {announcements[0].title}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{announcements[0].content}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0 px-2 py-1 rounded bg-slate-500/10">
                {announcements[0].author}
              </span>
            </div>
          )}

          {/* İSTATİSTİK SAYAÇLARI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80 shadow-xs"}`}>
              <span className="text-xs font-medium text-slate-400">
                {viewScope === "all" ? "Tüm Stüdyo İşleri" : "Eklediğim İşler"}
              </span>
              <div className={`text-2xl font-bold mt-1 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {displayedProjects.length}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80 shadow-xs"}`}>
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> İnceleniyor
              </span>
              <div className="text-2xl font-bold text-amber-500 mt-1 tracking-tight">{pendingCount}</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80 shadow-xs"}`}>
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı
              </span>
              <div className="text-2xl font-bold text-emerald-500 mt-1 tracking-tight">{approvedCount}</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80 shadow-xs"}`}>
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Kabul Edilmedi
              </span>
              <div className="text-2xl font-bold text-rose-500 mt-1 tracking-tight">{rejectedCount}</div>
            </div>
          </div>

          {/* İÇERİK ALANI */}
          {activeTab !== "tasks" ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {["Tümü", "İnceleniyor", "Onaylandı", "Kabul Edilmedi"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setProjectFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        projectFilter === filter
                          ? (isDark ? "bg-white text-slate-950 font-bold shadow-xs" : "bg-slate-900 text-white font-bold shadow-xs")
                          : (isDark ? "bg-[#0d0f14] border border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {permissions.canViewAllProjects && (
                  <div className={`flex items-center p-1 rounded-xl border self-start sm:self-auto ${
                    isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-slate-100 border-slate-200"
                  }`}>
                    <button
                      onClick={() => setViewScope("my")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        viewScope === "my"
                          ? (isDark ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-900 shadow-xs")
                          : "text-slate-400"
                      }`}
                    >
                      Benim İşlerim
                    </button>
                    <button
                      onClick={() => setViewScope("all")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        viewScope === "all"
                          ? (isDark ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-900 shadow-xs")
                          : "text-slate-400"
                      }`}
                    >
                      Tüm Stüdyo
                    </button>
                  </div>
                )}
              </div>

              {filteredProjects.length === 0 ? (
                <div className={`p-14 rounded-3xl border text-center transition-all ${
                  isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80 shadow-xs"
                }`}>
                  <FolderGit2 className="w-10 h-10 text-slate-500 mx-auto mb-2.5 opacity-60" />
                  <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Gösterilecek iş bulunamadı</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Yeni bir Script, 3D Model, Müzik veya Build çalışması ekleyin.</p>
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 ${
                      isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Yeni İş Ekle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((p) => {
                    const reviewObj = reviewStatuses[p.reviewStatus] || reviewStatuses["İnceleniyor"];
                    const ReviewIcon = reviewObj.icon;

                    return (
                      <div
                        key={p.id}
                        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                          isDark
                            ? "bg-[#0d0f14] border-[#1a1d26] hover:border-slate-700 hover:shadow-lg hover:shadow-black/40"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                              isDark ? "bg-slate-800/90 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {p.workType || "Script"}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${reviewObj.badge}`}>
                              <ReviewIcon className="w-3 h-3" />
                              {reviewObj.name}
                            </span>
                          </div>

                          <h3 className={`text-base font-bold mb-1.5 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                            {p.title}
                          </h3>

                          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-60" />
                            İşi Yapan: <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{p.worker || "Belirtilmedi"}</span>
                          </p>

                          {p.description && (
                            <p className={`text-xs p-3 rounded-xl border mb-4 line-clamp-3 leading-relaxed ${
                              isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                            }`}>
                              {p.description}
                            </p>
                          )}
                        </div>

                        <div>
                          {p.workLink ? (
                            <a
                              href={p.workLink.startsWith("http") ? p.workLink : `https://${p.workLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mb-3 active:scale-95 ${
                                isDark
                                  ? "bg-[#111318] hover:bg-slate-800 text-white border border-[#1a1d26] hover:border-slate-700"
                                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                              }`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Çalışma Bağlantısını Aç
                            </a>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic text-center mb-3">
                              Bağlantı linki eklenmedi
                            </div>
                          )}

                          <div className={`pt-2.5 border-t flex items-center justify-between text-xs text-slate-500 ${
                            isDark ? "border-[#1a1d26]" : "border-slate-100"
                          }`}>
                            <span>Ekleyen: {p.creator}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10">Kayıtlı</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 pt-2">
              {displayedTasks.length === 0 ? (
                <div className={`p-14 rounded-3xl border text-center shadow-xs ${
                  isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200/80"
                }`}>
                  <CheckSquare className="w-10 h-10 text-slate-500 mx-auto mb-2.5 opacity-60" />
                  <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Açık görev bulunmuyor</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {canAssignTasks ? "Ekip üyelerine yeni bir sprint görevi atayın." : "Size atanmış aktif bir görev bulunmuyor."}
                  </p>
                </div>
              ) : (
                displayedTasks.map((task) => {
                  const priorityObj = priorityOptions.find(pr => pr.name === task.priority) || priorityOptions[0];

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3.5 ${
                        task.completed
                          ? (isDark ? "bg-[#07080b]/60 border-[#1a1d26] opacity-60" : "bg-slate-50 border-slate-200 opacity-60")
                          : (isDark ? "bg-[#0d0f14] border-[#1a1d26] shadow-sm" : "bg-white border-slate-200 shadow-xs")
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id, task.completed)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                            task.completed
                              ? (isDark ? "bg-white border-white text-slate-950" : "bg-slate-950 border-slate-950 text-white")
                              : "border-slate-400 hover:border-slate-600 dark:border-slate-600"
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${task.completed ? "line-through text-slate-500" : (isDark ? "text-white" : "text-slate-900")}`}>
                              {task.title}
                            </span>
                            {task.isPrivate && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-medium flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Gizli
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {task.project && <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>[{task.project}]</span>}
                            {task.assignedTo && <span>• Atanan: <b>{task.assignedTo}</b></span>}
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${priorityObj.color}`}>
                              {task.priority || "Normal"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>

      {/* PROJE / İŞ EKLE FORMU */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden transition-all ${
            isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
            }`}>
              <div>
                <h3 className="font-bold text-sm">Yeni İş / Proje Teslimi</h3>
                <p className="text-[11px] text-slate-400">Çalışmanızı stüdyo incelemesine gönderin</p>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePreSubmitProject} className="p-6 space-y-4 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div>
                <label className="block font-semibold mb-1">Proje / İş Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ana Harita Tasarımı, Silah Animasyonları..."
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white focus:ring-white/10" : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/10"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold">İş Türü & Uzmanlık *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {workTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = newProject.workType === type.name;
                    return (
                      <button
                        type="button"
                        key={type.name}
                        onClick={() => setNewProject({ ...newProject, workType: type.name })}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 truncate ${
                          isSelected
                            ? (isDark ? "bg-white text-slate-950 border-white shadow-xs" : "bg-slate-900 text-white border-slate-900 shadow-xs")
                            : (isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">İşi Yapan</label>
                  <input
                    type="text"
                    placeholder="Ad Soyad / Nickname"
                    value={newProject.worker}
                    onChange={(e) => setNewProject({ ...newProject, worker: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" /> Çalışma Linki (Drive/GitHub)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={newProject.workLink}
                    onChange={(e) => setNewProject({ ...newProject, workLink: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  rows="2"
                  placeholder="Yapılan işin detayları veya stüdyo için notlar..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border resize-none focus:outline-none ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-between gap-3 ${
                isDark ? "border-[#1a1d26]" : "border-slate-100"
              }`}>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Güvenlik Onayı Gerekir
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className={`px-3.5 py-2 rounded-xl border font-medium text-xs transition-colors ${
                      isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 ${
                      isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    İlerlet & Onaya Sun
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÇALIŞMA TESLİM VE TELİF TAAHHÜT UYARI MODALI */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-7 space-y-4 transition-all ${
            isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                isDark ? "bg-amber-950/40 border-amber-800 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Çalışma Teslim Taahhüdü</h3>
                <p className="text-[11px] text-slate-400">Lütfen göndermeden önce kuralları onaylayınız</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
              isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400">İş:</span>
                <span className="font-bold truncate max-w-[200px]">{newProject.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tür:</span>
                <span className="text-indigo-500 font-semibold">{newProject.workType}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Bu çalışmanın <b>özgün olduğunu</b>, çalıntı veya kopya varlık içermediğini beyan ederim.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldBan className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Stüdyo dosyalarını üçüncü şahıslarla paylaşmayacağımı (<b>leak/sızdırma yasağı</b>) taahhüt ederim.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Kural ihlali tespitinde <b>stüdyodan kalıcı banlanacağımı</b> ve yasal yaptırımları kabul ederim.</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitAccepted}
                  onChange={(e) => setCommitAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-slate-900 cursor-pointer"
                />
                <span className="text-xs font-semibold leading-tight select-none">
                  Stüdyo kurallarını, telif ve teslim taahhüdünü okudum, kabul ediyorum.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCommitModal(false)}
                className={`w-1/3 py-2.5 rounded-xl border font-medium text-xs transition-colors ${
                  isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Geri Dön
              </button>
              <button
                type="button"
                disabled={!commitAccepted || isSubmitting}
                onClick={handleFinalSubmitProject}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {isSubmitting ? "Gönderiliyor..." : (
                  <>
                    <FileCheck className="w-4 h-4" /> Onaylıyorum, İşi Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GÖREV ATAMA MODALI (DISCORD ENTEGRELİ) */}
      {showTaskModal && canAssignTasks && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all ${
            isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
            }`}>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Ekibe Görev Ata
                </h3>
                <p className="text-[11px] text-slate-400">Atanan görev otomatik olarak Discord'a bildirilecektir</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Araç Süspansiyon Scriptini Tamamla..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Görevin Atanacağı Üye *</label>
                <select
                  required
                  value={newTask.assignedToId}
                  onChange={(e) => {
                    const member = teamMembers.find(m => m.id === e.target.value);
                    setNewTask({
                      ...newTask,
                      assignedToId: e.target.value,
                      assignedTo: member ? member.displayName : ""
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs font-medium cursor-pointer ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="">Ekip Üyesi Seçiniz...</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({m.role || "Geliştirici"} - {m.customTitle || m.managementRole || "Üye"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">İlgili Proje Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Cyber Ascent"
                  value={newTask.project}
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Öncelik Seviyesi</label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map((pr) => {
                    const isSelected = newTask.priority === pr.name;
                    return (
                      <button
                        type="button"
                        key={pr.name}
                        onClick={() => setNewTask({ ...newTask, priority: pr.name })}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all active:scale-95 ${
                          isSelected
                            ? (isDark ? "bg-white text-slate-950 border-white shadow-xs" : "bg-slate-900 text-white border-slate-900 shadow-xs")
                            : (isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                        }`}
                      >
                        {pr.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200"
              }`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTask.isPrivate}
                    onChange={(e) => setNewTask({ ...newTask, isPrivate: e.target.checked })}
                    className="w-4 h-4 rounded accent-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5 text-indigo-500" /> Sadece Atanan Kişi Görsün (Özel Görev)
                    </span>
                    <p className="text-[10px] text-slate-400">İşaretlenirse diğer ekip üyelerinin panosunda gizlenir.</p>
                  </div>
                </label>
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                isDark ? "border-[#1a1d26]" : "border-slate-100"
              }`}>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className={`px-3.5 py-2 rounded-xl border font-medium text-xs ${
                    isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  Görevi Ata & Discord'a Bildir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI ASİSTANI SOHBET MODALI */}
      {showAiChat && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-xl w-full h-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden transition-all ${
            isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/70"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    True Kinetic AI Stüdyo Asistanı
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono">
                      Gemini Online
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Luau Scripting, 3D Modelleme & Hata Ayıklama Desteği</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiChat(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs [scrollbar-width:thin]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? (isDark ? "bg-white text-slate-950 font-medium" : "bg-slate-900 text-white font-medium")
                        : (isDark ? "bg-[#07080b] border border-[#1a1d26] text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800")
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Stüdyo asistanı düşünüyor ve yanıt hazırlıyor...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendAiMessage} className={`p-4 border-t flex items-center gap-2 shrink-0 ${
              isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
            }`}>
              <input
                type="text"
                placeholder="Örn: Roblox Luau DataStore scripti nasıl yazılır? Veya 3D rigging ipuçları..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 transition-all ${
                  isDark ? "bg-[#07080b] border-[#1a1d26] text-white focus:ring-white/10" : "bg-white border-slate-200 text-slate-900 focus:ring-slate-900/10"
                }`}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiLoading}
                className={`p-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 ${
                  isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
                title="Gönder"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// 2. BAŞVURU VE SÖZLEŞME FORMU
// =========================================================
function ApplicationFormScreen({ currentUser, userData, onLogout, theme, toggleTheme }) {
  const [appForm, setAppForm] = useState({
    roleApplied: "Scripter",
    customRole: "",
    experience: "1-2 Yıl",
    discordTag: "",
    portfolioUrl: "",
    aboutMe: "",
    termsAccepted: false
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isDark = theme === "dark";
  const roles = ["Scripter", "3D Modeler", "Builder", "Animator", "Composer", "UI/UX Designer", "VFX/SFX", "Web Dev", "Diğer"];
  const expLevels = ["1 Yıldan Az", "1-2 Yıl", "3-4 Yıl", "5+ Yıl (Profesyonel)"];

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!appForm.termsAccepted) {
      setErrorMsg("Lütfen stüdyo gizlilik ve telif sözleşmelerini onaylayınız.");
      return;
    }
    if (!appForm.discordTag.trim()) {
      setErrorMsg("Lütfen Discord kullanıcı adınızı giriniz.");
      return;
    }
    if (appForm.roleApplied === "Diğer" && !appForm.customRole.trim()) {
      setErrorMsg("Lütfen başvurmak istediğiniz rolü yazınız.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const finalRole = appForm.roleApplied === "Diğer" ? appForm.customRole.trim() : appForm.roleApplied;

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        application: {
          ...appForm,
          roleApplied: finalRole,
          submittedAt: new Date().toISOString()
        },
        status: "pending"
      });
    } catch (err) {
      setErrorMsg("Başvuru gönderilemedi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans transition-colors ${
      isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      <div className="max-w-xl w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
            }`}>
              TK
            </div>
            <h1 className="text-base font-bold tracking-tight">Stüdyo Ekip Başvuru Formu</h1>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26] text-amber-400" : "bg-white border-slate-200 text-slate-600 shadow-xs"
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl transition-all ${
          isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200"
        }`}>
          {errorMsg && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 mb-5 ${
              isDark ? "bg-rose-950/30 border-rose-800/60 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleApplicationSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1.5">Başvurulan Rol / Uzmanlık</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setAppForm({ ...appForm, roleApplied: r })}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                      appForm.roleApplied === r
                        ? (isDark ? "bg-white text-slate-950 border-white shadow-xs" : "bg-slate-900 text-white border-slate-900 shadow-xs")
                        : (isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {appForm.roleApplied === "Diğer" && (
                <div className={`mt-2.5 p-3 rounded-2xl border ${
                  isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200"
                }`}>
                  <label className="block font-semibold mb-1">Hangi rolde başvuruyorsunuz? *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Composer, Seslendirmen, Çevirmen, Konsept Çizeri..."
                    value={appForm.customRole}
                    onChange={(e) => setAppForm({ ...appForm, customRole: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? "bg-[#0d0f14] border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1.5">Deneyim / Tecrübe Yılı</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {expLevels.map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setAppForm({ ...appForm, experience: lvl })}
                    className={`py-2 px-1.5 rounded-xl border text-center text-xs font-medium transition-all active:scale-95 ${
                      appForm.experience === lvl
                        ? (isDark ? "bg-white text-slate-950 border-white shadow-xs" : "bg-slate-900 text-white border-slate-900 shadow-xs")
                        : (isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Discord Kullanıcı Adınız *</label>
                <input
                  type="text"
                  required
                  placeholder="kullanici_adi"
                  value={appForm.discordTag}
                  onChange={(e) => setAppForm({ ...appForm, discordTag: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Portföy / Örnek Çalışma Bağlantısı</label>
                <input
                  type="text"
                  placeholder="Devforum, ArtStation, Drive, GitHub"
                  value={appForm.portfolioUrl}
                  onChange={(e) => setAppForm({ ...appForm, portfolioUrl: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Kendinizden ve Çalışmalarınızdan Bahsedin</label>
              <textarea
                rows="3"
                placeholder="Hangi projelerde yer aldınız, stüdyoya neler katabilirsiniz..."
                value={appForm.aboutMe}
                onChange={(e) => setAppForm({ ...appForm, aboutMe: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border resize-none focus:outline-none ${
                  isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div className={`p-4 rounded-2xl border space-y-2.5 ${
              isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appForm.termsAccepted}
                  onChange={(e) => setAppForm({ ...appForm, termsAccepted: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded accent-slate-900 cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed text-slate-400">
                  <Link href="/legal" target="_blank" className={`font-semibold underline ${isDark ? "text-white" : "text-slate-900"}`}>
                    Telif Hakkı, Fikri Mülkiyet (IP), Gizlilik Sözleşmesi (NDA) ve Stüdyo Ceza Kurallarını
                  </Link>{" "}
                  okudum, stüdyo varlıklarını sızdırmayacağımı (leak) ve kurallara uyacağımı taahhüt ederim.
                </span>
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 ${
                  isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {loading ? "Gönderiliyor..." : (
                  <>
                    <FileCheck className="w-4 h-4" /> Başvuruyu Onaylayıp Gönder
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-400"
              >
                Çıkış Yap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 3. YASAKLI / BEKLEME EKRANI (GATEKEEPER)
// =========================================================
function RestrictedAccessScreen({ currentUser, userData, onLogout, onRefresh, theme, toggleTheme }) {
  const isBanned = userData?.status === "banned" || userData?.status === "suspended";
  const isRejected = userData?.status === "rejected";
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden transition-colors ${
      isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      <div className="max-w-md w-full relative z-10">
        <div className={`p-8 rounded-3xl border shadow-xl text-center ${
          isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex justify-end mb-2">
            <button onClick={toggleTheme} className="text-slate-400 hover:text-slate-200 p-1">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
            isBanned || isRejected
              ? (isDark ? "bg-rose-950/40 border-rose-800 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600")
              : (isDark ? "bg-amber-950/40 border-amber-800 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600")
          }`}>
            {isBanned || isRejected ? (
              <ShieldBan className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <h2 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isBanned
              ? "Stüdyodan Yasaklandınız"
              : isRejected
              ? "Başvurunuz Reddedildi"
              : "Başvurunuz İnceleniyor"}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {isBanned
              ? "Hesabınız kural ihlali veya yönetici kararıyla askıya alınmıştır."
              : isRejected
              ? "Ekip başvurunuz yönetici tarafından onaylanmamıştır."
              : "Stüdyo başvuru dosyanız yönetici onay masasına iletildi. Onaylandığında çalışma alanınız otomatik olarak açılacaktır."}
          </p>

          <div className={`p-3.5 rounded-2xl border space-y-2 text-xs font-mono text-left mb-6 ${
            isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kullanıcı:</span>
              <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{userData?.displayName || currentUser?.displayName || "Aday"}</span>
            </div>
            {userData?.application?.roleApplied && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Başvurulan Rol:</span>
                <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{userData.application.roleApplied}</span>
              </div>
            )}
            {userData?.application?.discordTag && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Discord:</span>
                <span className="text-slate-400">{userData.application.discordTag}</span>
              </div>
            )}
            <div className={`flex items-center justify-between pt-1.5 border-t ${isDark ? "border-[#1a1d26]" : "border-slate-200"}`}>
              <span className="text-slate-400">Durum:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isBanned || isRejected
                  ? "bg-rose-950/50 text-rose-400"
                  : "bg-amber-950/50 text-amber-400 flex items-center gap-1"
              }`}>
                {!isBanned && !isRejected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                {isBanned ? "Yasaklandı (Ban)" : isRejected ? "Reddedildi" : "Yönetici İncelemesinde"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {!isBanned && !isRejected && (
              <button
                onClick={onRefresh}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                  isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Durumu Kontrol Et
              </button>
            )}
            <button
              onClick={onLogout}
              className={`w-full py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/legal" className="text-xs text-slate-400 hover:text-slate-200 underline font-mono">
            Yasal Sözleşmeler & Stüdyo Kuralları
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. AUTH VE ANA SAYFA KONTROLÜ
// ==========================================
export default function HubAuthPage() {
  const [theme, setTheme] = useState("light");
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("tk_theme") || "light";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("tk_theme", nextTheme);
  };

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);

        unsubUserDoc = onSnapshot(userDocRef, (snap) => {
          const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());

          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            const newUserData = {
              uid: user.uid,
              displayName: user.displayName || user.email.split("@")[0],
              email: user.email.toLowerCase(),
              role: isAdmin ? "admin" : "developer",
              customTitle: isAdmin ? "CEO / Kurucu" : "Ekip Üyesi",
              permissions: isAdmin ? {
                canAccessAdmin: true,
                canReviewProjects: true,
                canViewAllProjects: true,
                canApproveUsers: true,
                canModerateUsers: true,
                canPostAnnouncements: true
              } : {
                canAccessAdmin: false,
                canReviewProjects: false,
                canViewAllProjects: false,
                canApproveUsers: false,
                canModerateUsers: false,
                canPostAnnouncements: false
              },
              status: isAdmin ? "approved" : "unapplied",
              createdAt: serverTimestamp()
            };
            setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
        }, (err) => console.log("User doc dinlenemedi:", err));
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        if (formData.displayName) {
          await updateProfile(user, { displayName: formData.displayName });
        }

        const isAdmin = ADMIN_EMAILS.includes(formData.email.toLowerCase());

        const newUserData = {
          uid: user.uid,
          displayName: formData.displayName || "Ekip Üyesi",
          email: formData.email.toLowerCase(),
          role: isAdmin ? "admin" : "developer",
          customTitle: isAdmin ? "CEO / Kurucu" : "Ekip Üyesi",
          permissions: isAdmin ? {
            canAccessAdmin: true,
            canReviewProjects: true,
            canViewAllProjects: true,
            canApproveUsers: true,
            canModerateUsers: true,
            canPostAnnouncements: true
          } : {
            canAccessAdmin: false,
            canReviewProjects: false,
            canViewAllProjects: false,
            canApproveUsers: false,
            canModerateUsers: false,
            canPostAnnouncements: false
          },
          status: isAdmin ? "approved" : "unapplied",
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", user.uid), newUserData);
        setUserData(newUserData);
        setSuccessMsg("Hesap oluşturuldu.");
      }
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setErrorMsg("E-posta veya şifre hatalı.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Bu e-posta adresi zaten kullanımda.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      } else {
        setErrorMsg(err.message || "Bir hata oluştu.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleRefresh = async () => {
    if (currentUser) {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) setUserData(snap.data());
    }
  };

  const isDark = theme === "dark";

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans text-xs ${
        isDark ? "bg-[#07080b] text-slate-300" : "bg-[#f8fafc] text-slate-600"
      }`}>
        Stüdyo Yükleniyor...
      </div>
    );
  }

  const isMasterAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

  // 1. ONAYLI KULLANICI VEYA CEO (SIDEBAR + KARŞILAMA ALANI)
  if (currentUser && (userData?.status === "approved" || isMasterAdmin)) {
    return (
      <HubDashboard
        currentUser={currentUser}
        userData={userData || { role: "admin", customTitle: "CEO / Kurucu", displayName: currentUser.displayName || "Admin" }}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // 2. YENİ KAYDOLDU AMA BAŞVURU DOLDURMADI
  if (currentUser && userData && userData.status === "unapplied") {
    return (
      <ApplicationFormScreen
        currentUser={currentUser}
        userData={userData}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // 3. BAŞVURDU AMA ONAY BEKLİYOR / YASAKLI / REDDEDİLDİ
  if (currentUser && userData && (userData.status === "pending" || userData.status === "banned" || userData.status === "suspended" || userData.status === "rejected")) {
    return (
      <RestrictedAccessScreen
        currentUser={currentUser}
        userData={userData}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // 4. GİRİŞ & KAYIT EKRANI
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 font-sans transition-colors duration-200 ${
      isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
              isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
            }`}>
              TK
            </div>
            <div>
              <h1 className={`font-bold text-lg tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                True Kinetic Hub
              </h1>
              <p className="text-xs text-slate-400">Ekip Giriş Paneli</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26] text-amber-400 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs"
            }`}
            title={isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
          isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className={`grid grid-cols-2 p-1 rounded-xl mb-5 ${
            isDark ? "bg-[#07080b]" : "bg-slate-100"
          }`}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(""); }}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isLogin
                  ? (isDark ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-950 shadow-xs")
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(""); }}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isLogin
                  ? (isDark ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-950 shadow-xs")
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {errorMsg && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 mb-4 ${
              isDark ? "bg-rose-950/30 border-rose-800/60 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 mb-4 ${
              isDark ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {!isLogin && (
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Ad Soyad</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="displayName"
                    required
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Adınız Soyadınız"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white focus:ring-white/10" : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/10"
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-400 mb-1">E-Posta</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white focus:ring-white/10" : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/10"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Şifre</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] text-white focus:ring-white/10" : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/10"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1 active:scale-[0.98] disabled:opacity-50 ${
                isDark ? "bg-white hover:bg-slate-200 text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {actionLoading ? "İşleniyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol & Başvuruya Geç"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/legal" className="text-xs text-slate-400 hover:text-slate-200 underline font-mono">
            Yasal Sözleşmeler & Kurallar
          </Link>
        </div>
      </div>
    </div>
  );
}