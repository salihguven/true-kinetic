// app/admin/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db, ADMIN_EMAILS } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Trash2,
  FolderGit2,
  ExternalLink,
  Megaphone,
  Plus,
  User,
  X,
  ShieldBan,
  AlertTriangle,
  Send,
  Award,
  Crown,
  Eye,
  Check,
  Lock,
  Sliders,
  Sun,
  Moon,
  FileCheck
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [isCEO, setIsCEO] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);

  // Veriler
  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [projectFilter, setProjectFilter] = useState("Tümü");

  // Özel Rol State'leri
  const [customRoles, setCustomRoles] = useState({});

  // Modallar
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({ title: "", content: "" });

  const [showWarnModal, setShowWarnModal] = useState(false);
  const [selectedWarnUser, setSelectedWarnUser] = useState(null);
  const [warnMessage, setWarnMessage] = useState("");

  // CEO İZİN DÜZENLEME MODALI
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedPermUser, setSelectedPermUser] = useState(null);
  const [editPerms, setEditPerms] = useState({
    canAccessAdmin: false,
    canReviewProjects: false,
    canViewAllProjects: false,
    canApproveUsers: false,
    canModerateUsers: false,
    canPostAnnouncements: false,
    customTitle: "Ekip Üyesi"
  });

  const presetRoles = ["Scripter", "3D Modeler", "Builder", "Composer", "Animator", "UI/UX Designer", "Web Dev"];

  // Tema Senkronizasyonu
  useEffect(() => {
    const savedTheme = localStorage.getItem("tk_theme") || "light";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("tk_theme", nextTheme);
  };

  const isDark = theme === "dark";

  // SIKI GÜVENLİK VE İZİN KONTROLÜ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const isMasterCEO = ADMIN_EMAILS.includes(user.email?.toLowerCase());
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        const perms = userData?.permissions || {};
        const hasAccess = isMasterCEO || perms.canAccessAdmin === true;

        if (!hasAccess) {
          setIsAuthorized(false);
          setLoading(false);
          setTimeout(() => router.replace("/"), 2000);
          return;
        }

        setCurrentUser(user);
        setIsCEO(isMasterCEO);
        setUserPermissions(isMasterCEO ? {
          canAccessAdmin: true,
          canReviewProjects: true,
          canViewAllProjects: true,
          canApproveUsers: true,
          canModerateUsers: true,
          canPostAnnouncements: true,
        } : perms);

        setIsAuthorized(true);
        fetchData();
      } catch (err) {
        console.error("Yetki kontrol hatası:", err);
        setIsAuthorized(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qUsers = query(collection(db, "users"));
      const userSnap = await getDocs(qUsers);
      const uList = [];
      userSnap.forEach((d) => uList.push({ id: d.id, ...d.data() }));
      setUsersList(uList);

      const qProjects = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const projSnap = await getDocs(qProjects);
      const pList = [];
      projSnap.forEach((d) => pList.push({ id: d.id, ...d.data() }));
      setProjectsList(pList);
    } catch (err) {
      console.error("Veriler getirilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  // CEO İzin Düzenleme Modalını Aç
  const openPermissionModal = (user) => {
    setSelectedPermUser(user);
    const p = user.permissions || {};
    setEditPerms({
      canAccessAdmin: p.canAccessAdmin || false,
      canReviewProjects: p.canReviewProjects || false,
      canViewAllProjects: p.canViewAllProjects || false,
      canApproveUsers: p.canApproveUsers || false,
      canModerateUsers: p.canModerateUsers || false,
      canPostAnnouncements: p.canPostAnnouncements || false,
      customTitle: user.customTitle || user.managementRole || "Ekip Üyesi"
    });
    setShowPermModal(true);
  };

  // CEO İzinleri Kaydet
  const handleSavePermissions = async () => {
    if (!isCEO) {
      alert("İzinleri yalnızca CEO (Master Admin) düzenleyebilir.");
      return;
    }
    if (!selectedPermUser) return;

    try {
      await updateDoc(doc(db, "users", selectedPermUser.id), {
        permissions: {
          canAccessAdmin: editPerms.canAccessAdmin,
          canReviewProjects: editPerms.canReviewProjects,
          canViewAllProjects: editPerms.canViewAllProjects,
          canApproveUsers: editPerms.canApproveUsers,
          canModerateUsers: editPerms.canModerateUsers,
          canPostAnnouncements: editPerms.canPostAnnouncements,
        },
        customTitle: editPerms.customTitle.trim() || "Ekip Üyesi",
        managementRole: editPerms.customTitle.trim() || "Ekip Üyesi"
      });

      setUsersList(prev => prev.map(u => u.id === selectedPermUser.id ? {
        ...u,
        permissions: editPerms,
        customTitle: editPerms.customTitle.trim(),
        managementRole: editPerms.customTitle.trim()
      } : u));

      setShowPermModal(false);
      alert(`${selectedPermUser.displayName} adlı kullanıcının izinleri güncellendi!`);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Başvuru Onayla ve Rol Ata
  const handleApproveWithRole = async (userId, assignedRole) => {
    if (!isCEO && !userPermissions.canApproveUsers) {
      alert("Ekip başvurularını onaylama izniniz bulunmuyor.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "approved",
        role: assignedRole.trim(),
        customTitle: "Ekip Üyesi",
        managementRole: "Ekip Üyesi"
      });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: "approved", role: assignedRole.trim(), customTitle: "Ekip Üyesi" } : u));
      alert(`Kullanıcı "${assignedRole.trim()}" rolüyle onaylandı!`);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Kullanıcı Durumunu Değiştir (Reddet / Yasakla)
  const handleUserStatusChange = async (userId, newStatus) => {
    if (!isCEO && !userPermissions.canModerateUsers) {
      alert("Kullanıcı yasaklama veya reddetme izniniz yok.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Kullanıcıya Uyarı Gönder
  const handleSendWarning = async (e) => {
    e.preventDefault();
    if (!isCEO && !userPermissions.canModerateUsers) {
      alert("Uyarı gönderme izniniz yok.");
      return;
    }
    if (!selectedWarnUser || !warnMessage.trim()) return;
    try {
      await updateDoc(doc(db, "users", selectedWarnUser.id), {
        warning: warnMessage.trim()
      });
      setUsersList(prev => prev.map(u => u.id === selectedWarnUser.id ? { ...u, warning: warnMessage.trim() } : u));
      setShowWarnModal(false);
      setWarnMessage("");
      alert(`${selectedWarnUser.displayName} adlı kullanıcıya uyarı iletildi!`);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Kullanıcı Silme (Sadece CEO)
  const handleDeleteUser = async (userId) => {
    if (!isCEO) {
      alert("Kullanıcı kaydını silme yetkisi sadece CEO'ya aittir.");
      return;
    }
    if (!confirm("Bu kullanıcıyı sistemden tamamen silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Proje İnceleme Durumu Güncelle (Onay / Red)
  const handleProjectReview = async (projectId, newReviewStatus) => {
    if (!isCEO && !userPermissions.canReviewProjects) {
      alert("Proje onaylama veya reddetme izniniz yok.");
      return;
    }
    try {
      await updateDoc(doc(db, "projects", projectId), {
        reviewStatus: newReviewStatus
      });
      setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, reviewStatus: newReviewStatus } : p));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Proje Sil (Sadece CEO)
  const handleDeleteProject = async (projectId) => {
    if (!isCEO) {
      alert("Projeleri silme yetkisi sadece CEO'ya aittir.");
      return;
    }
    if (!confirm("Bu projeyi tamamen silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setProjectsList(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Duyuru Yayınla
  const handlePublishAnnounce = async (e) => {
    e.preventDefault();
    if (!isCEO && !userPermissions.canPostAnnouncements) {
      alert("Duyuru yayınlama izniniz yok.");
      return;
    }
    if (!newAnnounce.title.trim()) return;
    try {
      await addDoc(collection(db, "announcements"), {
        ...newAnnounce,
        author: currentUser?.displayName || (isCEO ? "CEO" : "Yönetici"),
        createdAt: serverTimestamp()
      });
      setShowAnnounceModal(false);
      setNewAnnounce({ title: "", content: "" });
      alert("Duyuru tüm ekibe yayınlandı!");
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans text-xs ${
        isDark ? "bg-[#07080b] text-slate-300" : "bg-[#f8fafc] text-slate-600"
      }`}>
        Yetkiler Doğrulanıyor...
      </div>
    );
  }

  // YETKİSİZ KULLANICI ENGEL EKRANI
  if (!isAuthorized) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 font-sans transition-colors ${
        isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
      }`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border shadow-xl text-center ${
          isDark ? "bg-[#0d0f14] border-rose-900/40" : "bg-white border-rose-200"
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
            isDark ? "bg-rose-950/40 border-rose-800 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600"
          }`}>
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1">Erişim Reddedildi (403)</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Bu yönetim masasına sadece CEO tarafından <b>"Yönetim Masası Erişimi"</b> izni verilmiş yetkililer girebilir.
          </p>
          <Link
            href="/"
            className={`inline-block px-4 py-2 rounded-xl text-xs font-semibold ${
              isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            Çalışma Alanıma Dön
          </Link>
        </div>
      </div>
    );
  }

  const pendingUsers = usersList.filter(u => u.status === "pending" || u.status === "unapplied");
  const approvedUsers = usersList.filter(u => u.status === "approved");
  const bannedOrRejectedUsers = usersList.filter(u => u.status === "banned" || u.status === "rejected" || u.status === "suspended");

  const filteredProjects = projectsList.filter(p => {
    if (projectFilter === "Tümü") return true;
    return (p.reviewStatus || "İnceleniyor") === projectFilter;
  });

  return (
    <div className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-200 ${
      isDark ? "bg-[#07080b] text-slate-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ÜST BAR */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? "border-[#1a1d26]" : "border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`p-2 rounded-xl border transition-all active:scale-95 shadow-xs ${
                isDark ? "bg-[#0d0f14] border-[#1a1d26] text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                True Kinetic Yönetim Masası
              </h1>
              <p className="text-xs text-slate-400">
                Giriş Yapan: <b className={isDark ? "text-white" : "text-slate-800"}>{currentUser?.displayName}</b> • Unvan:{" "}
                <span className="font-bold text-indigo-500 uppercase">
                  [{isCEO ? "👑 CEO / Kurucu" : (currentUser?.customTitle || "Yetkili")}]
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isDark ? "bg-[#0d0f14] border-[#1a1d26] text-amber-400 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs"
              }`}
              title={isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {(isCEO || userPermissions.canPostAnnouncements) && (
              <button
                onClick={() => setShowAnnounceModal(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                  isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" /> Duyuru Yayınla
              </button>
            )}

            <button
              onClick={fetchData}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isDark ? "bg-[#0d0f14] border-[#1a1d26] text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
              }`}
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TAB SEÇİCİ */}
        <div className={`flex items-center gap-2 border-b pb-3 ${
          isDark ? "border-[#1a1d26]" : "border-slate-200"
        }`}>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-95 ${
              activeTab === "projects"
                ? (isDark ? "bg-white text-slate-950 shadow-xs" : "bg-slate-900 text-white shadow-xs")
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")
            }`}
          >
            <FolderGit2 className="w-4 h-4" /> İş & Proje İnceleme ({projectsList.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-95 ${
              activeTab === "users"
                ? (isDark ? "bg-white text-slate-950 shadow-xs" : "bg-slate-900 text-white shadow-xs")
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")
            }`}
          >
            <Users className="w-4 h-4" /> Ekip Başvuruları & Yetki Masası ({usersList.length})
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PROJE & İŞ İNCELEME */}
        {activeTab === "projects" && (
          <div className="space-y-4">
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

            {filteredProjects.length === 0 ? (
              <div className={`p-14 rounded-3xl border text-center shadow-xs ${
                isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200"
              }`}>
                <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto mb-2.5 opacity-60" />
                <h3 className="text-sm font-semibold">İncelenecek iş bulunamadı</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map((p) => {
                  const isPending = (p.reviewStatus || "İnceleniyor") === "İnceleniyor";
                  const isApproved = p.reviewStatus === "Onaylandı";
                  const isRejected = p.reviewStatus === "Kabul Edilmedi";

                  return (
                    <div
                      key={p.id}
                      className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
                        isDark ? "bg-[#0d0f14] border-[#1a1d26] hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                            isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {p.workType || "Script"}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                              isApproved
                                ? (isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                : isRejected
                                ? (isDark ? "bg-rose-950/40 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-700 border-rose-200")
                                : (isDark ? "bg-amber-950/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200")
                            }`}
                          >
                            {p.reviewStatus || "İnceleniyor"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold mb-1">{p.title}</h3>

                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 opacity-60" />
                          İşi Yapan: <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{p.worker || p.creator}</span>
                          <span className="text-slate-500">({p.userEmail || p.creator})</span>
                        </p>

                        {p.description && (
                          <p className={`text-xs p-3 rounded-xl border mb-3 leading-relaxed ${
                            isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                          }`}>
                            {p.description}
                          </p>
                        )}

                        {p.workLink && (
                          <a
                            href={p.workLink.startsWith("http") ? p.workLink : `https://${p.workLink}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:underline mb-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Çalışma Bağlantısını İncele
                          </a>
                        )}
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                        isDark ? "border-[#1a1d26]" : "border-slate-100"
                      }`}>
                        {(isCEO || userPermissions.canReviewProjects) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleProjectReview(p.id, "Onaylandı")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                isApproved
                                  ? "bg-emerald-600 text-white"
                                  : (isDark ? "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                              }`}
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleProjectReview(p.id, "İnceleniyor")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                isPending
                                  ? "bg-amber-600 text-white"
                                  : (isDark ? "bg-amber-950/40 text-amber-400 hover:bg-amber-900/60" : "bg-amber-50 text-amber-700 hover:bg-amber-100")
                              }`}
                            >
                              İnceleniyor
                            </button>
                            <button
                              onClick={() => handleProjectReview(p.id, "Kabul Edilmedi")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                isRejected
                                  ? "bg-rose-600 text-white"
                                  : (isDark ? "bg-rose-950/40 text-rose-400 hover:bg-rose-900/60" : "bg-rose-50 text-rose-700 hover:bg-rose-100")
                              }`}
                            >
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">İnceleme yetkiniz bulunmuyor</span>
                        )}

                        {isCEO && (
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EKİP BAŞVURULARI & CEO İZİN MASASI */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* BAŞVURU DOSYALARI */}
            <div>
              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Gelen Ekip Başvuru Dosyaları ({pendingUsers.length})
              </h2>

              {pendingUsers.length === 0 ? (
                <div className={`p-6 rounded-2xl border text-center text-xs text-slate-500 ${
                  isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200"
                }`}>
                  Onay bekleyen başvuru dosyası bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => {
                    const app = user.application;
                    const customRoleVal = customRoles[user.id] || "";

                    return (
                      <div
                        key={user.id}
                        className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
                          isDark ? "bg-[#0d0f14] border-amber-900/40" : "bg-white border-amber-200"
                        }`}
                      >
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
                          isDark ? "border-[#1a1d26]" : "border-slate-100"
                        }`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base">{user.displayName}</span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold ${
                                isDark ? "bg-amber-950/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {app?.roleApplied || "Başvuru Bekleniyor"}
                              </span>
                              {app?.experience && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${
                                  isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {app.experience}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                          </div>

                          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                            <span>Discord: <b className={isDark ? "text-slate-200" : "text-slate-800"}>{app?.discordTag || "Girilmedi"}</b></span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {app?.aboutMe && (
                            <div className={`p-3 rounded-xl border ${
                              isDark ? "bg-[#07080b] border-[#1a1d26] text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700"
                            }`}>
                              <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Motivasyon / Hakkında</span>
                              <p className="leading-relaxed">{app.aboutMe}</p>
                            </div>
                          )}

                          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                            isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-100"
                          }`}>
                            <div>
                              <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Portföy / Örnek Çalışma</span>
                              {app?.portfolioUrl ? (
                                <a
                                  href={app.portfolioUrl.startsWith("http") ? app.portfolioUrl : `https://${app.portfolioUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-500 font-semibold underline flex items-center gap-1 truncate"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" /> {app.portfolioUrl}
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">Portföy linki verilmedi</span>
                              )}
                            </div>

                            <div className="pt-2 mt-2 border-t border-slate-500/20 flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Gizlilik & Telif Sözleşmesi Onaylandı (NDA Signed)</span>
                            </div>
                          </div>
                        </div>

                        {/* ROL VEREREK ONAYLA */}
                        <div className={`pt-3 border-t space-y-2.5 ${isDark ? "border-[#1a1d26]" : "border-slate-100"}`}>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0">Hazır Rol:</span>
                            {presetRoles.map((r) => (
                              <button
                                key={r}
                                onClick={() => handleApproveWithRole(user.id, r)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                                  isDark ? "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-600 hover:text-white border-emerald-800" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>

                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl border ${
                            isDark ? "bg-[#07080b] border-[#1a1d26]" : "bg-slate-50 border-slate-100"
                          }`}>
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                placeholder="Özel rol yazın (Örn: Lead Composer, Seslendirmen...)"
                                value={customRoleVal}
                                onChange={(e) => setCustomRoles({ ...customRoles, [user.id]: e.target.value })}
                                className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none flex-1 ${
                                  isDark ? "bg-[#0d0f14] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                                }`}
                              />
                              <button
                                onClick={() => handleApproveWithRole(user.id, customRoleVal || app?.roleApplied || "Geliştirici")}
                                className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all active:scale-95 ${
                                  isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                                }`}
                              >
                                Rolü Ver & Onayla
                              </button>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleUserStatusChange(user.id, "rejected")}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                                  isDark ? "bg-rose-950/40 border-rose-800 text-rose-400 hover:bg-rose-900/60" : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reddet
                              </button>
                              {isCEO && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AKTİF ÜYELER & CEO İZİN MASASI */}
            <div>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                <Users className="w-3.5 h-3.5" /> Onaylı Ekip Üyeleri & İzin Yönetimi ({approvedUsers.length})
              </h2>

              <div className="space-y-2.5">
                {approvedUsers.map((user) => {
                  const userTitle = user.customTitle || user.managementRole || "Ekip Üyesi";
                  const p = user.permissions || {};

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isDark ? "bg-[#0d0f14] border-[#1a1d26]" : "bg-white border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{user.displayName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold font-mono ${
                            isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {user.role || "Developer"}
                          </span>
                          
                          {/* UNVAN ROZETİ */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
                            isDark ? "bg-indigo-950/40 text-indigo-400 border-indigo-800/60" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {userTitle === "CEO" && "👑 "}
                            {userTitle}
                          </span>

                          {p.canReviewProjects && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">İş Onaylayabilir</span>}
                          {p.canViewAllProjects && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Tüm Projeleri Görür</span>}
                          {p.canModerateUsers && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">Moderatör</span>}

                          {user.warning && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 ${
                              isDark ? "bg-amber-950/40 text-amber-400 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}>
                              <AlertTriangle className="w-3 h-3" /> Uyarılı
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* CEO İÇİN ÖZEL İZİN BUTONU */}
                        {isCEO && (
                          <button
                            onClick={() => openPermissionModal(user)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                              isDark ? "bg-indigo-950/40 text-indigo-400 border-indigo-800 hover:bg-indigo-900/60" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" /> İzinleri Ayarla
                          </button>
                        )}

                        {(isCEO || userPermissions.canModerateUsers) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWarnUser(user);
                                setWarnMessage(user.warning || "");
                                setShowWarnModal(true);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all active:scale-95 ${
                                isDark ? "bg-amber-950/40 text-amber-400 border-amber-800 hover:bg-amber-900/60" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Uyarı Ver
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`${user.displayName} adlı kullanıcıyı stüdyodan yasaklamak istediğinize emin misiniz?`)) {
                                  handleUserStatusChange(user.id, "banned");
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all active:scale-95 ${
                                isDark ? "bg-rose-950/40 text-rose-400 border-rose-800 hover:bg-rose-900/60" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              }`}
                            >
                              <ShieldBan className="w-3.5 h-3.5" /> Yasakla
                            </button>
                          </>
                        )}

                        {isCEO && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* YASAKLANANLAR */}
            {bannedOrRejectedUsers.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldBan className="w-3.5 h-3.5" /> Yasaklananlar & Reddedilenler ({bannedOrRejectedUsers.length})
                </h2>

                <div className="space-y-2.5">
                  {bannedOrRejectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between gap-4 ${
                        isDark ? "bg-[#0d0f14] border-rose-900/30" : "bg-white border-rose-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{user.displayName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                            isDark ? "bg-rose-950/50 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {user.status === "banned" ? "Yasaklandı (Ban)" : "Reddedildi"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {(isCEO || userPermissions.canModerateUsers) && (
                          <button
                            onClick={() => handleApproveWithRole(user.id, user.application?.roleApplied || "Developer")}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
                              isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            Yasağı Kaldır & Onayla
                          </button>
                        )}
                        {isCEO && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CEO İZİN VE RÜTBE DÜZENLEME MODALI (SİYAH ÇUBUKSUZ) */}
        {showPermModal && selectedPermUser && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  {selectedPermUser.displayName} İçin CEO İzin Masası
                </h3>
                <button onClick={() => setShowPermModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold mb-1">Görünecek Unvan / Rütbe Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Forum Yöneticisi, Group Leader, Baş Besteci, Admin..."
                    value={editPerms.customTitle}
                    onChange={(e) => setEditPerms({ ...editPerms, customTitle: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Bu unvan kullanıcının profilinde ve panellerinde rozet olarak görünür.</p>
                </div>

                <div className={`space-y-2 pt-3 border-t ${isDark ? "border-[#1a1d26]" : "border-slate-100"}`}>
                  <label className="block font-bold mb-2">Özel İzin Anahtarları</label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">🛡️ Yönetim Masasına Erişim (Admin Panel)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Kullanıcının /admin yönetim paneline girmesine izin verir.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canAccessAdmin}
                      onChange={(e) => setEditPerms({ ...editPerms, canAccessAdmin: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">📋 Proje & İş İnceleme (Onay / Red)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ekip üyelerinin eklediği çalışmaları onaylayabilir veya reddedebilir.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canReviewProjects}
                      onChange={(e) => setEditPerms({ ...editPerms, canReviewProjects: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">🚀 Tüm Stüdyo Projelerini Görme</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Hub ekranında tüm stüdyonun projelerini canlı izleyebilir (Group Leader yetkisi).</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canViewAllProjects}
                      onChange={(e) => setEditPerms({ ...editPerms, canViewAllProjects: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">👥 Ekip Başvurularını Onaylama / Reddetme</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Yeni kaydolan adayların başvuru dosyalarını inceleyip stüdyoya alabilir.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canApproveUsers}
                      onChange={(e) => setEditPerms({ ...editPerms, canApproveUsers: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">⚖️ Üye Moderasyonu (Uyarı & Yasaklama)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Kural ihlali yapan üyelere uyarı gönderebilir veya stüdyodan yasaklayabilir.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canModerateUsers}
                      onChange={(e) => setEditPerms({ ...editPerms, canModerateUsers: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isDark ? "bg-[#07080b] border-[#1a1d26] hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}>
                    <div>
                      <div className="font-semibold">📢 Duyuru Yayınlama</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tüm ekibin ekranında görünen stüdyo duyurularını paylaşabilir.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPerms.canPostAnnouncements}
                      onChange={(e) => setEditPerms({ ...editPerms, canPostAnnouncements: e.target.checked })}
                      className="w-4 h-4 mt-1 rounded accent-slate-900 cursor-pointer"
                    />
                  </label>
                </div>

                <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                  isDark ? "border-[#1a1d26]" : "border-slate-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowPermModal(false)}
                    className={`px-3.5 py-2 rounded-xl border font-medium text-xs ${
                      isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                      isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    İzinleri Kaydet & Uygula
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UYARI GÖNDERME MODALI */}
        {showWarnModal && selectedWarnUser && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {selectedWarnUser.displayName} İçin Uyarı
                </h3>
                <button onClick={() => setShowWarnModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendWarning} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Uyarı Mesajı</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Örn: Proje teslim tarihlerine dikkat ediniz..."
                    value={warnMessage}
                    onChange={(e) => setWarnMessage(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border resize-none focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                  isDark ? "border-[#1a1d26]" : "border-slate-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowWarnModal(false)}
                    className={`px-3.5 py-2 rounded-xl border font-medium text-xs ${
                      isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" /> Uyarıyı İlet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DUYURU MODALI */}
        {showAnnounceModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0d0f14] border-[#1a1d26] text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isDark ? "border-[#1a1d26] bg-[#090b0f]" : "border-slate-100 bg-slate-50/50"
              }`}>
                <h3 className="font-bold text-sm">Tüm Ekibe Duyuru Yayınla</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishAnnounce} className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Duyuru Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Sprint #4 Başladı"
                    value={newAnnounce.title}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Açıklama</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ekip için notlar..."
                    value={newAnnounce.content}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, content: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border resize-none focus:outline-none ${
                      isDark ? "bg-[#07080b] border-[#1a1d26] text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                  isDark ? "border-[#1a1d26]" : "border-slate-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowAnnounceModal(false)}
                    className={`px-3.5 py-2 rounded-xl border font-medium text-xs ${
                      isDark ? "border-[#1a1d26] text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                      isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    Yayınla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}