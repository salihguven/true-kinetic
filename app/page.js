import { Ban, ArrowUpRight } from "lucide-react";

export default function GonePage() {
  return (
    <main className="gone-page">
      <div className="gone-grid" aria-hidden="true" />
      <div className="gone-orb gone-orb-cyan" aria-hidden="true" />
      <div className="gone-orb gone-orb-orange" aria-hidden="true" />

      <section className="gone-content" aria-labelledby="gone-title">
        <div className="gone-mark" aria-hidden="true">
          <Ban />
        </div>
        <p className="gone-kicker">TRUE KINETIC STUDIOS</p>
        <h1 id="gone-title">Bu site artık yok.</h1>
        <p className="gone-description">
          True Kinetic web hizmetleri sonlandırıldı. Bu adres artık aktif bir web
          sitesi sunmuyor.
        </p>
        <div className="gone-status" role="status">
          <span className="gone-status-dot" aria-hidden="true" />
          <span>410 Gone</span>
        </div>
        <a className="gone-link" href="https://truekinetic.com">
          Ana adrese git
          <ArrowUpRight aria-hidden="true" />
        </a>
      </section>

      <footer className="gone-footer">
        <span>Web hizmetleri sonlandırıldı</span>
        <span aria-hidden="true">/</span>
        <span>© {new Date().getFullYear()} True Kinetic</span>
      </footer>
    </main>
  );
}
