export default function Services() {
  return (
    <>
      <h1 className="section-title">Services</h1>
      <div className="grid cards">
        <article className="card"><div className="media"></div><div className="body"><div style={{fontWeight: 800}}>Installation & sécurisation</div><div className="muted">On installe, câble, et sécurise tout votre set (caméra, lumière, son).</div></div></article>
        <article className="card"><div className="media"></div><div className="body"><div style={{fontWeight: 800}}>Assistance réalisateur</div><div className="muted">Un second cerveau pour fluidifier votre tournage.</div></div></article>
        <article className="card"><div className="media"></div><div className="body"><div style={{fontWeight: 800}}>Régie & logistique</div><div className="muted">Les petits détails qui évitent les gros retards.</div></div></article>
      </div>
    </>
  );
}