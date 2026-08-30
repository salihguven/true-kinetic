// components/HubDashboard.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, ADMIN_EMAILS } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import {
  Zap,
  FolderGit2,
  CheckSquare,
  Boxes,
  Users,
  Plus,
  LogOut,
  ShieldAlert,
  GitBranch,
  Gamepad2,
  CheckCircle2,
  Clock,
  Trash2,
  Layers,
  Megaphone,
  X
} from "lucide-react";

export default function HubDashboard({ currentUser, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Modallar
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  // Form State'leri
  const [newProject, setNewProject] = useState({
    title: "",
    type: "Roblox Game",
    engine: "Luau / Rojo",
    branch: "main",
    placeId: "",
    status: "Alpha Dev",
    progress: 10
  });

  const [newTask, setNewTask] = useState({
    title: "",
    project: "",
    assignedTo: currentUser.displayName || "Ekip Üyesi",
    priority: "Normal"
  });

  const [newAnnounce, setNewAnnounce] = useState({
    title: "",
    content: ""
  });

  const isAdmin = userData?.role === "admin" || ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

  // 1. Canlı Firestore Dinleyicileri (Real-time sync)
  useEffect(() => {
    // Projeleri Dinle
    const qProjects = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setProjects(list);
    }, (err) => console.log("Projeler dinlenemedi:", err));

    // Görevleri Dinle
    const qTasks = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setTasks(list);
    }, (err) => console.log("Görevler dinlenemedi:", err));

    // Duyuruları Dinle
    const qAnnounce = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubAnnounce = onSnapshot(qAnnounce, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setAnnouncements(list);
    }, (err) => console.log("Duyurular dinlenemedi:", err));

    return () => {
      unsubProjects();
      unsubTasks();
      unsubAnnounce();
    };
  }, []);

  // Proje Ekle
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        progress: Number(newProject.progress),
        creator: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp()
      });
      setShowProjectModal(false);
      setNewProject({
        title: "",
        type: "Roblox Game",
        engine: "Luau / Rojo",
        branch: "main",
        placeId: "",
        status: "Alpha Dev",
        progress: 10
      });
    } catch (err) {
      alert("Proje eklenemedi: " + err.message);
    }
  };

  // Görev Ekle
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        completed: false,
        creator: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp()
      });
      setShowTaskModal(false);
      setNewTask({
        title: "",
        project: projects[0]?.title || "Genel",
        assignedTo: currentUser.displayName || "Ekip Üyesi",
        priority: "Normal"
      });
    } catch (err) {
      alert("Görev eklenemedi: " + err.message);
    }
  };

  // Duyuru Ekle
  const handleAddAnnounce = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "announcements"), {
        ...newAnnounce,
        author: currentUser.displayName || "Admin",
        createdAt: serverTimestamp()
      });
      setShowAnnounceModal(false);
      setNewAnnounce({ title: "", content: "" });
    } catch (err) {
      alert("Duyuru eklenemedi: " + err.message);
    }
  };

  // Görev Tamamla/Geri Al
  const toggleTask = async (taskId, currentStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completed: !currentStatus
      });
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Proje Sil
  const deleteProject = async (id) => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
    } catch (err) {
      alert("Silinemedi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col">
      {/* 1. ÜST HEADER */}
      <header className="border-b border-[#1a1d26] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-lg text-white">TRUE KINETIC HUB</h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/30 font-mono">
                  Canlı Dev Portalı
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">by TK Studios</p>
            </div>
          </div>

          {/* Kullanıcı & Admin Butonları */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-200">{userData?.displayName || currentUser.email}</p>
              <p className="text-[10px] text-accent-cyan font-mono uppercase">{userData?.role || "Geliştirici"}</p>
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-orange text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-md"
              >
                <ShieldAlert className="w-4 h-4" /> Admin Paneli
              </Link>
            )}

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-[#07080b] border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. ANA ÇALIŞMA ALANI */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        
        {/* DUYURU BANDI (Varsa) */}
        {announcements.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-cyan/10 via-[#0d0f14] to-accent-orange/10 border border-accent-cyan/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-accent-cyan shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">{announcements[0].title}</span>
                <p className="text-xs text-gray-400 mt-0.5">{announcements[0].content}</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-mono shrink-0">Duyuru • {announcements[0].author}</span>
          </div>
        )}

        {/* İSTATİSTİK ŞERİDİ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0d0f14] border border-[#1a1d26]">
            <span className="text-xs text-gray-400 flex items-center justify-between">
              Aktif Projeler <FolderGit2 className="w-4 h-4 text-accent-cyan" />
            </span>
            <div className="text-2xl font-bold font-heading text-white mt-1">
              {projects.length} Proje
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0d0f14] border border-[#1a1d26]">
            <span className="text-xs text-gray-400 flex items-center justify-between">
              Bekleyen Görevler <CheckSquare className="w-4 h-4 text-accent-orange" />
            </span>
            <div className="text-2xl font-bold font-heading text-accent-orange mt-1">
              {tasks.filter((t) => !t.completed).length} Görev
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0d0f14] border border-[#1a1d26]">
            <span className="text-xs text-gray-400 flex items-center justify-between">
              Tamamlanan İşler <CheckCircle2 className="w-4 h-4 text-accent-green" />
            </span>
            <div className="text-2xl font-bold font-heading text-accent-green mt-1">
              {tasks.filter((t) => t.completed).length} Bitti
            </div>
          </div>
        </div>

        {/* TAB MENÜSÜ & AKSİYON BUTONLARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1a1d26] pb-4 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "projects"
                  ? "bg-accent-cyan text-black"
                  : "bg-[#0d0f14] border border-[#1a1d26] text-gray-400 hover:text-white"
              }`}
            >
              <FolderGit2 className="w-4 h-4" /> Projeler ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "tasks"
                  ? "bg-accent-orange text-black"
                  : "bg-[#0d0f14] border border-[#1a1d26] text-gray-400 hover:text-white"
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Görev & Sprint ({tasks.length})
            </button>
          </div>

          {/* Ekleme Butonları */}
          <div className="flex items-center gap-2">
            {activeTab === "projects" && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-orange text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110"
              >
                <Plus className="w-4 h-4" /> Yeni Proje
              </button>
            )}
            {activeTab === "tasks" && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-3.5 py-2 rounded-xl bg-accent-orange text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110"
              >
                <Plus className="w-4 h-4" /> Görev Ekle
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowAnnounceModal(true)}
                className="p-2 rounded-xl bg-[#0d0f14] border border-[#1a1d26] text-gray-300 hover:text-accent-cyan text-xs"
                title="Duyuru Yayınla"
              >
                <Megaphone className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* --- 1. PROJELER TABI --- */}
        {activeTab === "projects" && (
          <div>
            {projects.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0d0f14] border border-[#1a1d26] text-center">
                <FolderGit2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Henüz aktif proje yok</h3>
                <p className="text-xs text-gray-500 mb-4">İlk Roblox veya Web projenizi ekleyerek başlayın.</p>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2 rounded-xl bg-accent-cyan text-black font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> İlk Projeyi Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 rounded-2xl bg-[#0d0f14] border border-[#1a1d26] hover:border-accent-cyan/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-gray-500">{p.engine}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                          {p.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-heading text-white mb-1">{p.title}</h3>
                      <p className="text-xs text-gray-400 mb-4">{p.type}</p>

                      {/* İlerleme Çubuğu */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Geliştirme İlerlemesi</span>
                          <span className="text-accent-cyan font-mono font-bold">%{p.progress}</span>
                        </div>
                        <div className="w-full bg-[#07080b] h-2 rounded-full overflow-hidden border border-[#1a1d26]">
                          <div
                            className="bg-gradient-to-r from-accent-cyan to-accent-orange h-full rounded-full transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Teknik Bilgiler */}
                      <div className="p-3 rounded-xl bg-[#07080b] border border-[#1a1d26] space-y-1.5 text-xs font-mono mb-4">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <GitBranch className="w-3.5 h-3.5 text-accent-cyan" /> Branch:
                          </span>
                          <span className="text-gray-200 truncate max-w-[140px]">{p.branch || "main"}</span>
                        </div>
                        {p.placeId && (
                          <div className="flex items-center justify-between text-gray-400">
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <Gamepad2 className="w-3.5 h-3.5 text-accent-orange" /> Place ID:
                            </span>
                            <span className="text-gray-200">{p.placeId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1a1d26] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-gray-500">Ekleyen: {p.creator}</span>
                      {isAdmin && (
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                          title="Projeyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 2. GÖREVLER (TASKS) TABI --- */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0d0f14] border border-[#1a1d26] text-center">
                <CheckSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Açık görev yok</h3>
                <p className="text-xs text-gray-500">Tüm sprint görevleri tamamlandı veya henüz görev açılmadı.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    task.completed
                      ? "bg-[#07080b]/60 border-[#1a1d26] opacity-60"
                      : "bg-[#0d0f14] border-[#1a1d26] hover:border-accent-orange/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        task.completed
                          ? "bg-accent-green border-accent-green text-black"
                          : "border-gray-600 hover:border-accent-orange"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className={`text-sm font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="text-accent-cyan">[{task.project || "Genel"}]</span>
                        <span>• Atanan: {task.assignedTo}</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/5 font-mono">{task.priority}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={async () => {
                        if (confirm("Görevi silmek istiyor musunuz?")) {
                          await deleteDoc(doc(db, "tasks", task.id));
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* --- MODAL 1: YENİ PROJE EKLE --- */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-[#1a1d26] p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-white">Yeni Geliştirme Projesi Ekle</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Proje Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Project: Neon Protocol"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Proje Türü</label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                  >
                    <option value="Roblox Game">Roblox Game</option>
                    <option value="Next.js SaaS">Next.js SaaS</option>
                    <option value="3D Asset Pack">3D Asset Pack</option>
                    <option value="Espor Altyapısı">Espor Altyapısı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Engine / Altyapı</label>
                  <input
                    type="text"
                    placeholder="Luau / Rojo, UE5, Next.js"
                    value={newProject.engine}
                    onChange={(e) => setNewProject({ ...newProject, engine: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Git Branch</label>
                  <input
                    type="text"
                    placeholder="main veya dev"
                    value={newProject.branch}
                    onChange={(e) => setNewProject({ ...newProject, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Place ID (Varsa)</label>
                  <input
                    type="text"
                    placeholder="14892019482"
                    value={newProject.placeId}
                    onChange={(e) => setNewProject({ ...newProject, placeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">İlerleme: %{newProject.progress}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProject.progress}
                  onChange={(e) => setNewProject({ ...newProject, progress: e.target.value })}
                  className="w-full accent-accent-cyan"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-orange text-black font-bold text-xs hover:brightness-110 mt-2"
              >
                Projeyi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: GÖREV EKLE --- */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-[#1a1d26] p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-white">Yeni Sprint Görevi Aç</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Görev Açıklaması</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Anti-cheat v2 testlerini tamamla"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">İlgili Proje</label>
                  <input
                    type="text"
                    placeholder="Neon Protocol"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Öncelik</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-orange"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Yüksek">Yüksek 🔥</option>
                    <option value="Kritik Bug">Kritik Bug ⚠️</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent-orange text-black font-bold text-xs hover:brightness-110 mt-2"
              >
                Görevi Oluştur
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DUYURU EKLE (ADMIN) --- */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-[#1a1d26] p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-white">Stüdyo Duyurusu Yayınla</h3>
              <button onClick={() => setShowAnnounceModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAnnounce} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Duyuru Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Sprint #4 Başladı"
                  value={newAnnounce.title}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">İçerik</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ekip için duyuru detayları..."
                  value={newAnnounce.content}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-[#1a1d26] text-white focus:outline-none focus:border-accent-cyan resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent-cyan text-black font-bold text-xs hover:brightness-110 mt-2"
              >
                Duyuruyu Paylaş
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}