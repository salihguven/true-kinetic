// app/legal/page.js
"use client";

import { useState } from "react";
import { Analytics } from "@vercel/analytics/next"
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Lock,
  Copyright,
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  Scale,
  Ban,
  CheckCircle2
} from "lucide-react";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState("terms");

  const tabs = [
    { id: "terms", name: "Kullanım Koşulları", icon: FileText },
    { id: "privacy", name: "Gizlilik Politikası", icon: Lock },
    { id: "copyright", name: "Telif & Fikri Mülkiyet", icon: Copyright },
    { id: "sales", name: "Mesafeli Satış Sözleşmesi", icon: ShoppingCart },
    { id: "rules", name: "Stüdyo Kuralları & Cezalar", icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      {/* ÜST BAR */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-slate-700" />
                True Kinetic Studios • Yasal Bilgilendirme & Kurallar
              </h1>
              <p className="text-xs text-slate-500 font-mono">Resmi Stüdyo Politikaları v1.2</p>
            </div>
          </div>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Hub'a Dön
          </Link>
        </div>
      </header>

      {/* İÇERİK DÜZENİ */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        
        {/* SOL SEKME MENÜSÜ */}
        <aside className="w-full md:w-64 shrink-0 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Belgeler & Politikalar
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </aside>

        {/* SAĞ DETAYLI SÖZLEŞME METİNLERİ */}
        <section className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs leading-relaxed text-xs sm:text-sm text-slate-700 space-y-6">
          
          {/* ========================================================= */}
          {/* 1. KULLANIM KOŞULLARI (TERMS OF SERVICE)                  */}
          {/* ========================================================= */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Kullanım Koşulları (Terms of Service)</h2>
                <p className="text-xs text-slate-400">Son güncelleme: 2026 • True Kinetic Studios</p>
              </div>

              <p>
                True Kinetic Studios altyapılarını, Kinetik Hub portalını veya stüdyo tarafından sunulan dijital hizmetleri kullanan her ekip üyesi, müşteri ve ziyaretçi aşağıdaki şartları peşinen kabul etmiş sayılır.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">1. Hizmet Kapsamı</h3>
              <p>
                True Kinetic Studios; oyun geliştirme (Roblox, bağımsız oyunlar), 3D varlık üretimi, SaaS panelleri ve espor altyapı çözümleri sunar. Platform üzerindeki tüm haklar saklıdır.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">2. Kullanıcı Sorumlulukları</h3>
              <p>
                Kullanıcılar, hesap bilgilerini 3. şahıslarla paylaşamaz. Yetkisiz giriş denemeleri, tersine mühendislik (reverse engineering), sunuculara yönelik DDoS veya saldırı girişimleri derhal yasal yaptırıma ve kalıcı uzaklaştırmaya tabidir.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">3. Değişiklik Hakkı</h3>
              <p>
                Stüdyo yönetimi, hizmet koşullarını ve platform kurallarını önceden bildirmeksizin güncelleme hakkını saklı tutar.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. GİZLİLİK POLİTİKASI (PRIVACY POLICY)                   */}
          {/* ========================================================= */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Gizlilik & KVKK Politikası</h2>
                <p className="text-xs text-slate-400">Veri Güvenliği ve Gizlilik İlkelerimiz</p>
              </div>

              <p>
                True Kinetic Studios olarak kullanıcılarımızın ve ekip üyelerimizin kişisel verilerinin güvenliğine en üst düzeyde önem veriyoruz.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">1. Toplanan Veriler</h3>
              <p>
                Hub kaydı sırasında yalnızca ad soyad/nickname ve e-posta adresi toplanır. Bu veriler Firebase Authentication ve Firestore üzerinde şifreli olarak saklanır ve asla 3. taraflara satılmaz veya ticari amaçla paylaşılmaz.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">2. Proje Dosyaları ve Gizlilik</h3>
              <p>
                Geliştiriciler tarafından paylaşılan Google Drive, GitHub veya dosya linkleri yalnızca yetkili stüdyo yöneticileri tarafından incelenebilir. Dış erişime kapalı tutulur.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">3. Veri Silme Talebi</h3>
              <p>
                Her kullanıcı dilediği zaman stüdyo yönetimiyle iletişime geçerek sistemdeki verilerinin tamamen silinmesini talep edebilir.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. TELİF HAKKI & FİKRİ MÜLKİYET (COPYRIGHT & IP)          */}
          {/* ========================================================= */}
          {activeTab === "copyright" && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Telif Hakkı & Fikri Mülkiyet Politikası</h2>
                <p className="text-xs text-slate-400">Kod, 3D Model ve Dijital Varlık Mülkiyeti</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                <b>ÖNEMLİ:</b> True Kinetic Studios projeleri kapsamında üretilen her türlü kod (Luau/Script), 3D model (Blender/FBX), ses efekti (SFX), UI tasarımı ve harita stüdyonun fikri mülkiyetindedir.
              </div>

              <h3 className="text-sm font-bold text-slate-900 pt-2">1. Eser Sahipliği ve Kullanım Hakkı</h3>
              <p>
                Ekip üyeleri tarafından stüdyo adına geliştirilen varlıklar, stüdyonun yazılı izni olmaksızın başka bir oyunda, Roblox Creator Store'da veya ticari platformda satılamaz, sergilenemez veya dağıtılamaz.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">2. Kod ve Asset Sızdırma (Leak) Yasağı</h3>
              <p>
                Stüdyo dosyalarının, yerel scriptlerin veya modellerin izinsiz 3. şahıslara aktarılması ("leak") doğrudan telif hakkı ihlali (DMCA) sayılır ve yasal yaptırım başlatılır.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">3. DMCA ve İhlal Bildirimi</h3>
              <p>
                Telif hakkı ihlali tespit edildiğinde stüdyo yönetimi ilgili platformlarda (Roblox, GitHub, Discord, Web Hosting) derhal DMCA Takedown işlemi başlatır.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. MESAFELİ SATIŞ SÖZLEŞMESİ                              */}
          {/* ========================================================= */}
          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Mesafeli Satış Sözleşmesi</h2>
                <p className="text-xs text-slate-400">Dijital Varlık, Script & Hizmet Satış Koşulları</p>
              </div>

              <h3 className="text-sm font-bold text-slate-900 pt-2">1. Taraflar ve Konu</h3>
              <p>
                İşbu sözleşme; True Kinetic Studios tarafından dijital ortamda (Roblox Creator Store, Kinetik Hub, Web) sunulan dijital ürün, model, eklenti (plugin) veya yazılım hizmetlerinin alıcıya teslim koşullarını düzenler.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">2. Teslimat Şekli</h3>
              <p>
                Satın alınan ürünler dijital nitelikte olup (kod, model dosyası, erişim lisansı), ödeme onayının ardından anında veya taahhüt edilen teslim süresi içinde dijital ortamda teslim edilir.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">3. Cayma Hakkı & İade Politikası (Önemli)</h3>
              <p className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca; <b>elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallarda (dijital kod, 3D model, yazılım lisansı) cayma ve iade hakkı bulunmamaktadır.</b>
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. STÜDYO KURALLARI, İHLALLER & CEZALAR                   */}
          {/* ========================================================= */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Stüdyo Kuralları, İhlaller & Cezalar
                </h2>
                <p className="text-xs text-slate-400">Ekip İçi Disiplin ve Yaptırım Rehberi</p>
              </div>

              <p>
                True Kinetic Studios bünyesinde yer alan tüm geliştiriciler, tasarımcılar ve yetkililer aşağıdaki kurallara uymakla yükümlüdür:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <b>1. Derece Ağır İhlal (Kalıcı Ban + Yasal Süreç):</b> Stüdyo projelerini, kodlarını veya modellerini sızdırmak (leak), 3. kişilere satmak, sunuculara sabotaj veya dolandırıcılık girişiminde bulunmak.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <b>2. Derece İhlal (Resmi Uyarı + Yetki Askıya Alma):</b> Teslim tarihlerini mazeretsiz aksatmak, iş kalitesini kasten düşürmek, ekip içi saygısızlık veya gizlilik kurallarını ihmal etmek.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <b>3. İtiraz ve İletişim:</b> Verilen disiplin cezalarına ilişkin itirazlar yalnızca stüdyo yönetimine resmi gerekçelerle iletilebilir.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ALT FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © 2026 True Kinetic Studios. Tüm hakları saklıdır. • Gelecek için Tasarla
      </footer>
    </div>
  );
}