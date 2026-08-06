import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ResearchNavbar from "../../components/Layout/ResearchNavbar";
import styles from "../../styles/Research.module.css";

const stageLabel = { story: "故事阶段", evidence: "证据形成", consensus: "共识完成" };
const stageOrder = { story: 1, evidence: 2, consensus: 3 };

export default function ResearchWatchlist() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && localStorage.getItem("portfolio-theme") === "dark");
  const [form, setForm] = useState({ symbol: "", name: "", assetType: "Equity", market: "", stage: "story", thesis: "" });

  useEffect(() => { const dark = localStorage.getItem("portfolio-theme") === "dark"; document.documentElement.dataset.theme = dark ? "dark" : "light"; fetch("/api/research").then(r => r.json()).then(setData); }, []);
  const toggleTheme = () => setDarkMode(current => { const next = !current; localStorage.setItem("portfolio-theme", next ? "dark" : "light"); document.documentElement.dataset.theme = next ? "dark" : "light"; return next; });
  const assets = useMemo(() => (data?.assets || []).filter(a => stage === "all" || a.stage === stage).filter(a => `${a.symbol} ${a.name} ${a.thesis}`.toLowerCase().includes(query.toLowerCase())), [data, query, stage]);
  const counts = useMemo(() => ({ assets: data?.assets.length || 0, evidence: data?.evidence.length || 0, open: data?.questions.filter(q => q.status === "open").length || 0, forming: data?.assets.filter(a => a.stage === "evidence").length || 0 }), [data]);

  async function createAsset(event) {
    event.preventDefault();
    const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "assets", data: { ...form, symbol: form.symbol.toUpperCase(), status: "watching", conclusion: "待形成观察结论", tags: [] } }) });
    const asset = await response.json(); setData(current => ({ ...current, assets: [...current.assets, asset] })); setShowForm(false);
  }
  const exportData = () => { const link = document.createElement("a"); link.href = "/api/research?export=1"; link.download = "research-export.json"; link.click(); };
  if (!data) return <div className={styles.loading}>Loading research workspace…</div>;

  return <>
    <Head><title>Research Monitor | TMs Portfolio</title><meta name="description" content="Evidence-led investment research and review workspace."/></Head>
    <ResearchNavbar darkMode={darkMode} onTheme={toggleTheme} onExport={exportData}/>
    <main className={styles.page}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>EVIDENCE BEFORE CONSENSUS</span><h1>研究监控台</h1><p>把故事拆成可验证的证据链，在共识完成前持续观察、校准和复盘。</p></div><button className={styles.primaryButton} onClick={() => setShowForm(true)}>＋ 新建标的</button></section>
      <section className={styles.stats}>
        <div><span>监控标的</span><b>{counts.assets}</b><small>跨资产研究池</small></div><div><span>证据记录</span><b>{counts.evidence}</b><small>保留来源与时间</small></div><div><span>证据形成中</span><b className={styles.accentText}>{counts.forming}</b><small>优先研究窗口</small></div><div><span>未决问题</span><b>{counts.open}</b><small>等待验证</small></div>
      </section>
      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          <h3>阶段筛选</h3>{["all","story","evidence","consensus"].map(value => <button key={value} onClick={() => setStage(value)} className={stage === value ? styles.filterActive : ""}><span>{value === "all" ? "全部标的" : stageLabel[value]}</span><em>{value === "all" ? counts.assets : data.assets.filter(a => a.stage === value).length}</em></button>)}
          <div className={styles.framework}><span>研究链路</span><ol><li>场景 / 使用</li><li>收入</li><li>利润</li><li>现金流</li><li>股东价值</li></ol></div>
        </aside>
        <div className={styles.listArea}>
          <div className={styles.listHeader}><div><h2>监控列表</h2><p>{assets.length} 个标的 · 按最近更新</p></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索代码、名称或研究逻辑"/></div>
          <div className={styles.assetTable}><div className={styles.tableHead}><span>标的</span><span>当前阶段</span><span>证据进度</span><span>未决问题</span><span>最近更新</span></div>
            {assets.sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt)).map(asset => {
              const evidence = data.evidence.filter(e => e.assetId === asset.id); const verified = evidence.filter(e => e.verification === "verified").length; const questions = data.questions.filter(q => q.assetId === asset.id && q.status === "open").length;
              return <Link href={`/research/${asset.id}`} className={styles.assetRow} key={asset.id}><span className={styles.assetIdentity}><b>{asset.symbol}</b><small>{asset.name}</small></span><span><i className={`${styles.stagePill} ${styles[asset.stage]}`}>{stageLabel[asset.stage]}</i><small>Level {stageOrder[asset.stage]} / 3</small></span><span className={styles.progressCell}><span><i style={{width: `${evidence.length ? verified/evidence.length*100 : 0}%`}}/></span><small>{verified}/{evidence.length} 已验证</small></span><span><b>{questions}</b><small>open items</small></span><span><b>{new Date(asset.updatedAt).toLocaleDateString("zh-CN", {month:"short",day:"numeric"})}</b><small>{asset.conclusion}</small></span></Link>;
            })}
          </div>
        </div>
      </section>
    </main>
    {showForm && <div className={styles.modalBackdrop} onMouseDown={() => setShowForm(false)}><form className={styles.modal} onSubmit={createAsset} onMouseDown={e => e.stopPropagation()}><div><span className={styles.eyebrow}>ADD TO WATCHLIST</span><h2>新建研究标的</h2></div><label>代码<input required value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})}/></label><label>名称<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className={styles.formGrid}><label>资产类型<input value={form.assetType} onChange={e=>setForm({...form,assetType:e.target.value})}/></label><label>市场<input value={form.market} onChange={e=>setForm({...form,market:e.target.value})}/></label></div><label>初始阶段<select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}><option value="story">故事阶段</option><option value="evidence">证据形成</option><option value="consensus">共识完成</option></select></label><label>核心研究假设<textarea required rows="4" value={form.thesis} onChange={e=>setForm({...form,thesis:e.target.value})}/></label><div className={styles.modalActions}><button type="button" onClick={()=>setShowForm(false)}>取消</button><button className={styles.primaryButton}>创建标的</button></div></form></div>}
  </>;
}
