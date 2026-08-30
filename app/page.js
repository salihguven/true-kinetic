// app/page.js
"use client";

import { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";

// ==========================================
// 1. HUB DASHBOARD (SİLME BUTONU KALDIRILDI)
// ==========================================
function HubDashboard({ currentUser, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [projectFilter, setProjectFilter] = useState("Tümü");
  const [allProjects, setAllProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const workTypes = [
    { name: "Script", icon: Code2 },
    { name: "3D Model", icon: Box },
    { name: "Build", icon: Hammer },
    { name: "Animasyon", icon: Film },
    { name: "UI Tasarım", icon: Layout },
    { name: "VFX", icon: Sparkles },
    { name: "SFX / Ses", icon: Volume2 },
    { name: "Diğer", icon: FileText }
  ];

  const reviewStatuses = {
    "İnceleniyor": {
      name: "İnceleniyor",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock
    },
    "Onaylandı": {
      name: "Onaylandı",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2
    },
    "Kabul Edilmedi": {
      name: "Kabul Edilmedi",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle
    }
  };

  const priorityOptions = [
    { name: "Normal", color: "bg-slate-50 border-slate-200 text-slate-700" },
    { name: "Yüksek", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { name: "Kritik", color: "bg-rose-50 border-rose-200 text-rose-700" }
  ];

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
    assignedTo: currentUser?.displayName || "",
    priority: "Normal"
  });

  const isAdmin = userData?.role === "admin" || ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());

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

    return () => {
      unsubProjects();
      unsubTasks();
      unsubAnnounce();
    };
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        userId: currentUser.uid,
        userEmail: currentUser.email?.toLowerCase(),
        creator: currentUser?.displayName || currentUser?.email || "Ekip Üyesi",
        createdAt: serverTimestamp()
      });
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
    } catch (err) {
      alert("Proje eklenemedi: " + err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        completed: false,
        userId: currentUser.uid,
        creator: currentUser?.displayName || currentUser?.email || "Ekip Üyesi",
        createdAt: serverTimestamp()
      });
      setShowTaskModal(false);
      setNewTask({
        title: "",
        project: myProjects[0]?.title || "",
        assignedTo: currentUser?.displayName || "",
        priority: "Normal"
      });
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

  // SADECE GİRİŞ YAPAN KULLANICININ KENDİ İŞLERİ
  const myProjects = allProjects.filter(
    (p) => p.userId === currentUser.uid || p.userEmail === currentUser.email?.toLowerCase() || p.creator === (currentUser.displayName || currentUser.email)
  );

  const filteredProjects = myProjects.filter((p) => {
    if (projectFilter === "Tümü") return true;
    return (p.reviewStatus || "İnceleniyor") === projectFilter;
  });

  const approvedCount = myProjects.filter(p => p.reviewStatus === "Onaylandı").length;
  const pendingCount = myProjects.filter(p => (p.reviewStatus || "İnceleniyor") === "İnceleniyor").length;
  const rejectedCount = myProjects.filter(p => p.reviewStatus === "Kabul Edilmedi").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* ÜST HEADER */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              TK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-slate-900 tracking-tight">True Kinetic Hub</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  Çalışma Alanım
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800">{userData?.displayName || currentUser?.email}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{userData?.role || (isAdmin ? "Admin" : "Developer")}</p>
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-600" /> Admin Paneli
              </Link>
            )}

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ANA ÇALIŞMA ALANI */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        
        {/* YÖNETİCİ UYARISI (EĞER KULLANICIYA UYARI VERİLDİYSE GÖRÜNÜR) */}
        {userData?.warning && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Yönetici Uyarısı</span>
              <p className="text-xs text-amber-900 mt-0.5">{userData.warning}</p>
            </div>
          </div>
        )}

        {/* GENEL DUYURU BANDI */}
        {announcements.length > 0 && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Megaphone className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-900">{announcements[0].title}</span>
                <p className="text-xs text-slate-600 mt-0.5">{announcements[0].content}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium shrink-0">{announcements[0].author}</span>
          </div>
        )}

        {/* İSTATİSTİKLER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Eklediğim İşler</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{myProjects.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> İnceleniyor
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-rose-600 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Kabul Edilmedi
            </span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{rejectedCount}</div>
          </div>
        </div>

        {/* TAB MENÜSÜ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "projects"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" /> Eklediğim Projeler & İşler ({myProjects.length})
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "tasks"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Görev Listesi ({tasks.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "projects" && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni İş / Proje Ekle
              </button>
            )}
            {activeTab === "tasks" && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Görev Ekle
              </button>
            )}
          </div>
        </div>

        {/* 1. KULLANICININ KENDİ PROJELERİ (SİLME BUTONU KALDIRILDI) */}
        {activeTab === "projects" && (
          <div>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {["Tümü", "İnceleniyor", "Onaylandı", "Kabul Edilmedi"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProjectFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    projectFilter === filter
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
                <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Henüz bir iş eklemediniz</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Yeni bir Script, 3D Model veya Build çalışması ekleyin.</p>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-slate-800"
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
                      className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {p.workType || "Script"}
                          </span>
                          
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${reviewObj.badge}`}>
                            <ReviewIcon className="w-3 h-3" />
                            {reviewObj.name}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-1">{p.title}</h3>

                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          İşi Yapan: <span className="font-semibold text-slate-800">{p.worker || "Belirtilmedi"}</span>
                        </p>

                        {p.description && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 line-clamp-3">
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
                            className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors mb-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Çalışma Linkini Aç (Drive)
                          </a>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic text-center mb-3">
                            Bağlantı linki eklenmedi
                          </div>
                        )}

                        {/* SİLME BUTONU KALDIRILDI - SADECE TARİH BİLGİSİ */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span>Ekleyen: {p.creator}</span>
                          <span className="font-mono text-[10px]">Kayıtlı İş</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. GÖREVLER BÖLÜMÜ */}
        {activeTab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Açık görev bulunmuyor</h3>
                <p className="text-xs text-slate-500 mt-1">Ekip için yeni bir sprint görevi tanımlayın.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const priorityObj = priorityOptions.find(pr => pr.name === task.priority) || priorityOptions[0];

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.completed
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTask(task.id, task.completed)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          task.completed
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className={`text-xs font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {task.project && <span className="font-medium text-slate-600">[{task.project}]</span>}
                          {task.assignedTo && <span>• {task.assignedTo}</span>}
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${priorityObj.color}`}>
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

      {/* PROJE EKLE MODALI */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Yeni İş / Proje Ekle</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Proje / İş Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Cyber Ascent - Ana Harita"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İşi Yapan</label>
                <input
                  type="text"
                  placeholder="Ad Soyad veya Nickname"
                  value={newProject.worker}
                  onChange={(e) => setNewProject({ ...newProject, worker: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">İş Tipi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {workTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = newProject.workType === type.name;
                    return (
                      <button
                        type="button"
                        key={type.name}
                        onClick={() => setNewProject({ ...newProject, workType: type.name })}
                        className={`px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İşin Açıklaması</label>
                <textarea
                  rows="3"
                  placeholder="Yapılan işin detayları, revizeler veya notlar..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-500" /> Çalışma Linki (Google Drive / GitHub)
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={newProject.workLink}
                  onChange={(e) => setNewProject({ ...newProject, workLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">İşiniz eklendiğinde doğrudan yönetici incelemesine gönderilecektir.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 mt-2 transition-colors shadow-sm"
              >
                İşi Kaydet ve Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GÖREV EKLE MODALI */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Yeni Görev Ekle</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  placeholder="Yapılacak işi yazın..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İlgili Proje</label>
                <input
                  type="text"
                  placeholder="Örn: Cyber Ascent"
                  value={newTask.project}
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Atanan Kişi</label>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Öncelik Seviyesi</label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map((pr) => {
                    const isSelected = newTask.priority === pr.name;
                    return (
                      <button
                        type="button"
                        key={pr.name}
                        onClick={() => setNewTask({ ...newTask, priority: pr.name })}
                        className={`py-2 px-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pr.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 mt-2 transition-colors shadow-sm"
              >
                Görevi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// 2. YASAKLI / ERİŞİM KISITLI VE ONAY BEKLEME EKRANI
// =========================================================
function RestrictedAccessScreen({ currentUser, userData, onLogout, onRefresh }) {
  const isBanned = userData?.status === "banned" || userData?.status === "suspended";
  const isRejected = userData?.status === "rejected";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center">
          {/* İkon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
            isBanned || isRejected
              ? "bg-rose-50 border-rose-200 text-rose-600"
              : "bg-amber-50 border-amber-200 text-amber-600"
          }`}>
            {isBanned || isRejected ? (
              <ShieldBan className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            )}
          </div>

          {/* Başlık */}
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {isBanned
              ? "Stüdyodan Yasaklandınız"
              : isRejected
              ? "Başvurunuz Reddedildi"
              : "Erişim Kısıtlandı: Yetki Onayı Bekleniyor"}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {isBanned
              ? "Hesabınız kural ihlali veya yönetici kararıyla askıya alınmıştır. Stüdyo sistemlerine erişemezsiniz."
              : isRejected
              ? "Ekip başvurunuz yönetici tarafından onaylanmamıştır."
              : "True Kinetic Studios dahili çalışma alanına sadece onaylı ekip üyeleri erişebilir."}
          </p>

          {/* Hesap Detay Tablosu */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-mono text-left mb-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kullanıcı:</span>
              <span className="font-semibold text-slate-800">{userData?.displayName || currentUser?.displayName || "Ekip Üyesi"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">E-Posta:</span>
              <span className="text-slate-600">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-400">Erişim Durumu:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isBanned || isRejected
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-800 flex items-center gap-1"
              }`}>
                {!isBanned && !isRejected && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />}
                {isBanned ? "Yasaklandı (Banned)" : isRejected ? "Reddedildi" : "İnceleme Aşamasında"}
              </span>
            </div>
          </div>

          {/* Bilgilendirme Notu */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2 mb-6 text-left">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[11px] leading-tight">
              {isBanned || isRejected
                ? "İtiraz veya bilgi için stüdyo lideriyle iletişime geçebilirsiniz."
                : "Yönetici onay verdiği an ekranınız otomatik açılacaktır."}
            </span>
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-2">
            {!isBanned && !isRejected && (
              <button
                onClick={onRefresh}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Durumu Kontrol Et
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Çıkış Yap / Farklı Hesap
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-400 mt-4">
          🔒 True Kinetic Studios Security Protocol • Gateway v1.0
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 3. AUTH VE ANA SAYFA KONTROLÜ
// ==========================================
export default function HubAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
              status: isAdmin ? "approved" : "pending",
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
          status: isAdmin ? "approved" : "pending",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-600 font-sans text-xs">
        Yükleniyor...
      </div>
    );
  }

  const isMasterAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

  // 1. ONAYLI KULLANICI / MASTER ADMIN (HUB ÇALIŞMA ALANI)
  if (currentUser && (userData?.status === "approved" || isMasterAdmin)) {
    return (
      <HubDashboard
        currentUser={currentUser}
        userData={userData || { role: "admin", displayName: currentUser.displayName || "Admin" }}
        onLogout={handleLogout}
      />
    );
  }

  // 2. BEKLEMEDE / YASAKLI / REDDEDİLEN KULLANICI (GÜVENLİK EKRANI)
  if (currentUser && userData && (userData.status === "pending" || userData.status === "banned" || userData.status === "suspended" || userData.status === "rejected")) {
    return (
      <RestrictedAccessScreen
        currentUser={currentUser}
        userData={userData}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />
    );
  }

  // 3. GİRİŞ & KAYIT FORMU
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs mx-auto mb-3">
            TK
          </div>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">True Kinetic Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">Ekip Giriş Paneli</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-100 mb-5">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(""); }}
              className={`py-1.5 rounded-md text-xs font-medium transition-all ${
                isLogin ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(""); }}
              className={`py-1.5 rounded-md text-xs font-medium transition-all ${
                !isLogin ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ad Soyad</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="displayName"
                    required
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Adınız"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-Posta</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@truekinetic.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Şifre</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-1 disabled:opacity-50"
            >
              {actionLoading ? "İşleniyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}