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
  Send
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);

  // Veriler
  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [projectFilter, setProjectFilter] = useState("Tümü");

  // Duyuru & Uyarı Modalları
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({ title: "", content: "" });

  const [showWarnModal, setShowWarnModal] = useState(false);
  const [selectedWarnUser, setSelectedWarnUser] = useState(null);
  const [warnMessage, setWarnMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
        router.push("/");
      } else {
        setCurrentUser(user);
        fetchData();
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

  // Kullanıcı Durumunu Değiştir (Onayla / Reddet / Yasakla)
  const handleUserStatusChange = async (userId, newStatus) => {
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

  // Uyarıyı Temizle
  const handleClearWarning = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { warning: null });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, warning: null } : u));
      alert("Uyarı kaldırıldı.");
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Kullanıcı Silme
  const handleDeleteUser = async (userId) => {
    if (!confirm("Bu kullanıcıyı sistemden tamamen silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Proje İnceleme Durumu Güncelle
  const handleProjectReview = async (projectId, newReviewStatus) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        reviewStatus: newReviewStatus
      });
      setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, reviewStatus: newReviewStatus } : p));
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Proje Sil
  const handleDeleteProject = async (projectId) => {
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
    if (!newAnnounce.title.trim()) return;
    try {
      await addDoc(collection(db, "announcements"), {
        ...newAnnounce,
        author: currentUser.displayName || "Admin",
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-600 font-sans text-xs">
        Yönetim Masası Yükleniyor...
      </div>
    );
  }

  const pendingUsers = usersList.filter(u => u.status === "pending");
  const approvedUsers = usersList.filter(u => u.status === "approved");
  const bannedOrRejectedUsers = usersList.filter(u => u.status === "banned" || u.status === "rejected" || u.status === "suspended");

  const filteredProjects = projectsList.filter(p => {
    if (projectFilter === "Tümü") return true;
    return (p.reviewStatus || "İnceleniyor") === projectFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ÜST BAR */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                True Kinetic Yönetim Masası
              </h1>
              <p className="text-xs text-slate-500">İş İncelemeleri & Ekip Denetimi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Megaphone className="w-3.5 h-3.5" /> Duyuru Yayınla
            </button>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TAB SEÇİCİ */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "projects"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FolderGit2 className="w-4 h-4" /> İş & Proje İnceleme ({projectsList.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" /> Ekip Denetimi & Onay ({usersList.length})
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: PROJE & İŞ İNCELEME MASASI                         */}
        {/* ========================================================= */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">İncelenecek iş bulunamadı</h3>
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
                      className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {p.workType || "Script"}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isRejected
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {p.reviewStatus || "İnceleniyor"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-1">{p.title}</h3>

                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          İşi Yapan: <span className="font-semibold text-slate-800">{p.worker || p.creator}</span>
                          <span className="text-slate-400">({p.userEmail || p.creator})</span>
                        </p>

                        {p.description && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                            {p.description}
                          </p>
                        )}

                        {p.workLink && (
                          <a
                            href={p.workLink.startsWith("http") ? p.workLink : `https://${p.workLink}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Çalışma Linkini İncele (Drive / Link)
                          </a>
                        )}
                      </div>

                      {/* ADMIN AKSİYONLARI */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleProjectReview(p.id, "Onaylandı")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isApproved
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleProjectReview(p.id, "İnceleniyor")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isPending
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            İnceleniyor
                          </button>
                          <button
                            onClick={() => handleProjectReview(p.id, "Kabul Edilmedi")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isRejected
                                ? "bg-rose-600 text-white"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            Reddet
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EKİP DENETİMİ, UYARI, YASAKLAMA & ON AY           */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* 1. ONAY BEKLEYEN BAŞVURULAR (ONAYLA & REDDET) */}
            <div>
              <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Onay Bekleyen Başvurular ({pendingUsers.length})
              </h2>

              {pendingUsers.length === 0 ? (
                <div className="p-6 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                  Onay bekleyen ekip başvurusu bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{user.displayName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Başvuru Beklemede
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserStatusChange(user.id, "approved")}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                        </button>
                        <button
                          onClick={() => handleUserStatusChange(user.id, "rejected")}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Başvuruyu Reddet"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reddet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. AKTİF ÜYELER (UYARI VER & YASAKLA BUTONLARI) */}
            <div>
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Aktif Ekip Üyeleri ({approvedUsers.length})
              </h2>

              <div className="space-y-2.5">
                {approvedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{user.displayName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
                          {user.role || "Developer"}
                        </span>
                        {user.warning && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Uyarılı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      {user.warning && (
                        <p className="text-[11px] text-amber-700 mt-1 italic">Son Uyarı: "{user.warning}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* UYARI BUTONU */}
                      <button
                        onClick={() => {
                          setSelectedWarnUser(user);
                          setWarnMessage(user.warning || "");
                          setShowWarnModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Uyarı Ver
                      </button>

                      {/* YASAKLA (BAN) BUTONU */}
                      <button
                        onClick={() => {
                          if (confirm(`${user.displayName} adlı kullanıcıyı stüdyodan yasaklamak istediğinize emin misiniz?`)) {
                            handleUserStatusChange(user.id, "banned");
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <ShieldBan className="w-3.5 h-3.5" /> Yasakla (Ban)
                      </button>

                      {/* SİL BUTONU */}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Kullanıcıyı Tamamen Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. YASAKLANAN VEYA REDDEDİLENLER (YASAĞI KALDIR) */}
            {bannedOrRejectedUsers.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldBan className="w-3.5 h-3.5" /> Yasaklanan / Reddedilenler ({bannedOrRejectedUsers.length})
                </h2>

                <div className="space-y-2.5">
                  {bannedOrRejectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{user.displayName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            {user.status === "banned" ? "Yasaklandı (Ban)" : "Reddedildi"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserStatusChange(user.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-colors"
                        >
                          Yasağı Kaldır & Onayla
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Kaydı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* UYARI GÖNDERME MODALI */}
        {showWarnModal && selectedWarnUser && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {selectedWarnUser.displayName} İçin Uyarı
                </h3>
                <button onClick={() => setShowWarnModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendWarning} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Uyarı Mesajı</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Örn: Proje teslim tarihlerine dikkat ediniz..."
                    value={warnMessage}
                    onChange={(e) => setWarnMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800 resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bu uyarı kullanıcının çalışma ekranının en üstünde sarı şerit olarak belirecektir.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  {selectedWarnUser.warning && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClearWarning(selectedWarnUser.id);
                        setShowWarnModal(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
                    >
                      Uyarıyı Temizle
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
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
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Tüm Ekibe Duyuru Yayınla</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishAnnounce} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Duyuru Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Sprint #4 Başladı"
                    value={newAnnounce.title}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Açıklama</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ekip için notlar..."
                    value={newAnnounce.content}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 mt-2"
                >
                  Duyuruyu Yayınla
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}