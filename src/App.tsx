import { useState, type CSSProperties, type MouseEvent } from "react";
import { AuthFlow, type AuthMode, type UserProfile } from "./AuthFlow";
import "./App.css";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthlySpending = [
  2840, 3180, 2675, 3490, 3025, 3760, 2910, 3340, 3120, 3580, 3275, 2460,
];

const categories = [
  { name: "Home & bills", amount: 1280, color: "mint", share: 38 },
  { name: "Food & dining", amount: 840, color: "coral", share: 25 },
  { name: "Transport", amount: 590, color: "gold", share: 18 },
  { name: "Everything else", amount: 640, color: "blue", share: 19 },
];

const formatAmount = (amount: number) => amount.toLocaleString("en-IN");
const profilesStorageKey = "morrow-demo-profiles";
const sessionStorageKey = "morrow-demo-session";

function loadProfiles(): UserProfile[] {
  try {
    return JSON.parse(window.localStorage.getItem(profilesStorageKey) ?? "[]") as UserProfile[];
  } catch {
    return [];
  }
}

function loadSession(): UserProfile | null {
  try {
    const session = window.localStorage.getItem(sessionStorageKey);
    return session ? JSON.parse(session) as UserProfile : null;
  } catch {
    return null;
  }
}

function Dashboard({ profile, onOpenProfile }: { profile: UserProfile; onOpenProfile: () => void }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [activeNavigation, setActiveNavigation] = useState("overview");
  const monthOffset = (selectedYear - today.getFullYear()) * 12 + selectedMonth - today.getMonth();
  const spent = monthlySpending[((monthOffset % 12) + 12) % 12];
  const budget = 5200;
  const spentPercent = Math.round((spent / budget) * 100);
  const previousMonth = (selectedMonth + 11) % 12;
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  function navigate(event: MouseEvent<HTMLAnchorElement>, destination: string) {
    setActiveNavigation(destination);
    if (window.matchMedia("(max-width: 560px)").matches) {
      event.preventDefault();
      window.scrollTo(0, 0);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Morrow home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 3v3M4.9 7.9 7 10M19.1 7.9 17 10" /></svg>
          </span>
          <span className="brand-copy">
            <span className="brand-name">morrow<span className="brand-period">.</span></span>
            <span className="brand-tagline">A better tomorrow</span>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className={`nav-link ${activeNavigation === "overview" ? "active" : ""}`} href="#overview" onClick={(event) => navigate(event, "overview")}><span className="nav-icon">◫</span>Overview</a>
          <a className={`nav-link ${activeNavigation === "spending" ? "active" : ""}`} href="#spending" onClick={(event) => navigate(event, "spending")}><span className="nav-icon">↗</span>Spending</a>
          <a className={`nav-link ${activeNavigation === "borrowings" ? "active" : ""}`} href="#borrowings" onClick={(event) => navigate(event, "borrowings")}><span className="nav-icon">⇄</span>Borrowings</a>
          <a className={`nav-link ${activeNavigation === "budget" ? "active" : ""}`} href="#budget" onClick={(event) => navigate(event, "budget")}><span className="nav-icon">◷</span>My budget</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✳</span>
            <p>Small steps today,<br /><strong>more freedom tomorrow.</strong></p>
          </div>
          <button className="profile-button" type="button" onClick={onOpenProfile}>
            <span className="avatar">{profile.firstName[0]}{profile.lastName[0]}</span>
            <span className="profile-copy"><strong>{profile.firstName} {profile.lastName}</strong><small>Personal account</small></span>
            <span className="profile-menu">···</span>
          </button>
        </div>
      </aside>

      <main className="main-content" id="overview" data-view={activeNavigation}>
        <header className="topbar">
          <a className="mobile-brand" href="#overview" aria-label="Morrow, a better tomorrow" onClick={(event) => navigate(event, "overview")}>
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 3v3M4.9 7.9 7 10M19.1 7.9 17 10" /></svg>
            </span>
            <span className="brand-copy">
              <span className="brand-name">morrow<span className="brand-period">.</span></span>
              <span className="brand-tagline">A better tomorrow</span>
            </span>
          </a>
          <div className="breadcrumb">Your space <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="today-label">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
              <span className="notification-dot" />
            </button>
            <button className="icon-button profile-header-button" type="button" aria-label="Manage profile" onClick={onOpenProfile}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
            </button>
          </div>
        </header>

        <section className="welcome-banner" aria-label="Welcome">
          <div className="welcome-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR MONEY, IN A GOOD PLACE</div>
            <h1>A new way to<br />get <span>organized.</span></h1>
            <p>Welcome to a clearer view of your money, so you can organize life and make room for what matters next.</p>
            <a className="welcome-link" href="#spending">See where it goes <span>↗</span></a>
          </div>
          <div className="welcome-image" role="img" aria-label="Sunlight falling across a calm, thoughtfully arranged home">
            <div className="image-caption"><span>01 / 03</span><span>Make space for what matters</span></div>
          </div>
          <div className="welcome-orbit" aria-hidden="true">↗</div>
        </section>

        <section className="overview-heading">
          <div>
            <span className="section-kicker">YOUR OVERVIEW</span>
            <h2>The numbers, made simple.</h2>
          </div>
          <div className="date-filters" aria-label="Choose a reporting period">
            <label className="visually-hidden" htmlFor="month-filter">Month</label>
            <select id="month-filter" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
              {monthNames.map((month, index) => <option value={index} key={month}>{month}</option>)}
            </select>
            <label className="visually-hidden" htmlFor="year-filter">Year</label>
            <select id="year-filter" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
              {years.map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
            <span className="select-chevron" aria-hidden="true">⌄</span>
          </div>
        </section>

        <section className="summary-grid" aria-label={`${monthNames[selectedMonth]} ${selectedYear} account summary`}>
          <article className="summary-card spending-summary">
            <div className="card-topline"><span className="summary-icon icon-mint">↗</span><span className="comparison"><span>↘</span> 8.2%</span></div>
            <p className="summary-label">TOTAL SPENT</p>
            <div className="summary-value">₹{formatAmount(spent)}<span>.00</span></div>
            <p className="summary-foot">vs. ₹{formatAmount(monthlySpending[previousMonth])} last month</p>
            <div className="mini-bars" aria-hidden="true">{[32, 44, 37, 62, 48, 74, 54, 67, 46, 84, 59, 71].map((height, index) => <span key={index} style={{ "--bar-height": `${height}%` } as CSSProperties} />)}</div>
          </article>

          <article className="summary-card borrowing-summary" id="borrowings">
            <div className="card-topline"><span className="summary-icon icon-coral">⇄</span><span className="loan-status"><span /> 2 active</span></div>
            <p className="summary-label">MONEY TO PAY BACK</p>
            <div className="summary-value">₹{formatAmount(1240)}<span>.00</span></div>
            <p className="summary-foot">Across 2 borrowings <span className="foot-separator">·</span> next due Oct 12</p>
            <div className="repayment-track" aria-label="Borrowings repayment progress"><span /></div>
          </article>

          <article className="summary-card saved-summary">
            <div className="card-topline"><span className="summary-icon icon-gold">✳</span><span className="comparison positive">↗ on track</span></div>
            <p className="summary-label">SET ASIDE THIS MONTH</p>
            <div className="summary-value">₹{formatAmount(860)}<span>.00</span></div>
            <p className="summary-foot">You’re building a good habit.</p>
            <div className="savings-spark" aria-hidden="true"><svg viewBox="0 0 150 28" preserveAspectRatio="none"><path d="M1 24 C20 21 22 14 38 17 S58 23 73 12 S97 18 109 9 S132 12 149 2" /></svg></div>
          </article>
        </section>

        <section className="budget-card" id="budget">
          <div className="budget-copy">
            <span className="budget-icon">◷</span>
            <div><p className="budget-label">YOUR MONTHLY BUDGET</p><h3><strong>₹{formatAmount(budget)}</strong> <span>planned for {monthNames[selectedMonth]}</span></h3></div>
          </div>
          <div className="budget-progress-wrap">
            <div className="budget-progress-label"><span><strong>₹{formatAmount(spent)}</strong> spent</span><span>₹{formatAmount(budget - spent)} left</span></div>
            <div className="budget-progress"><span style={{ width: `${spentPercent}%` }} /></div>
            <p className="budget-caption"><span className="budget-status-dot" /> {spentPercent}% of your budget used</p>
          </div>
          <div className="budget-percent">{spentPercent}<span>%</span></div>
        </section>

        <section className="insights-grid" id="spending">
          <article className="insight-card flow-card">
            <div className="insight-header">
              <div><span className="section-kicker">THE BIG PICTURE</span><h3>Your spending flow</h3></div>
              <button className="more-button" type="button" aria-label="More spending chart options">···</button>
            </div>
            <div className="chart-summary"><strong>₹{formatAmount(spent)}</strong><span className="comparison"><span>↘</span> 8.2%</span><small>compared to {monthNames[previousMonth]}</small></div>
            <div className="flow-chart" role="img" aria-label={`Spending chart for ${monthNames[selectedMonth]}, with daily spending rising over the month`}>
              <div className="chart-y-labels"><span>₹1,000</span><span>₹750</span><span>₹500</span><span>₹250</span><span>₹0</span></div>
              <div className="chart-plot">
                <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
                <svg className="flow-svg" viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="flowFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9bdfc4" stopOpacity=".25" /><stop offset="100%" stopColor="#9bdfc4" stopOpacity="0" /></linearGradient></defs>
                  <path className="chart-area" d="M0 137 C30 127 34 115 64 119 S101 128 128 106 S159 99 185 109 S220 86 246 91 S278 77 308 91 S340 68 368 75 S400 54 427 69 S458 46 486 57 S525 35 550 44 S582 23 600 19 L600 170 L0 170Z" />
                  <path className="chart-line" d="M0 137 C30 127 34 115 64 119 S101 128 128 106 S159 99 185 109 S220 86 246 91 S278 77 308 91 S340 68 368 75 S400 54 427 69 S458 46 486 57 S525 35 550 44 S582 23 600 19" />
                  <circle className="chart-point" cx="600" cy="19" r="5" />
                </svg>
                <div className="chart-x-labels"><span>1 {monthNames[selectedMonth].slice(0, 3)}</span><span>8 {monthNames[selectedMonth].slice(0, 3)}</span><span>15 {monthNames[selectedMonth].slice(0, 3)}</span><span>22 {monthNames[selectedMonth].slice(0, 3)}</span><span>Today</span></div>
              </div>
            </div>
            <div className="chart-footer"><span><i className="legend-dot" /> Daily spending</span><span>Updated just now <i className="live-dot" /></span></div>
          </article>

          <article className="insight-card category-card">
            <div className="insight-header">
              <div><span className="section-kicker">WHERE IT GOES</span><h3>By category</h3></div>
              <button className="more-button" type="button" aria-label="More category options">···</button>
            </div>
            <div className="category-visual">
              <div className="donut-chart" role="img" aria-label="Spending split: home and bills 38%, food and dining 25%, transport 18%, everything else 19%">
                <div className="donut-center"><strong>{spentPercent}%</strong><span>of budget</span></div>
              </div>
              <div className="category-legend">{categories.map((category) => <div className="category-row" key={category.name}><span className={`category-swatch ${category.color}`} /><span className="category-name">{category.name}</span><strong>₹{formatAmount(category.amount)}</strong></div>)}</div>
            </div>
            <a href="#budget" className="category-link">Explore your spending <span>↗</span></a>
          </article>
        </section>

        <footer className="page-footer"><span>A clearer picture, one day at a time.</span><span>Everything’s up to date <i className="live-dot" /></span></footer>
      </main>
    </div>
  );
}

function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(loadSession);
  const [page, setPage] = useState<AuthMode | "dashboard">(() => loadSession() ? "dashboard" : "login");

  function persistProfiles(nextProfiles: UserProfile[]) {
    setProfiles(nextProfiles);
    window.localStorage.setItem(profilesStorageKey, JSON.stringify(nextProfiles));
  }

  function signIn(profile: UserProfile) {
    setCurrentProfile(profile);
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(profile));
    setPage("dashboard");
  }

  function register(profile: UserProfile) {
    persistProfiles([...profiles, profile]);
    signIn(profile);
  }

  function saveProfile(profile: UserProfile) {
    const nextProfiles = profiles.map((savedProfile) =>
      savedProfile.mobile === currentProfile?.mobile ? profile : savedProfile,
    );
    persistProfiles(nextProfiles);
    signIn(profile);
  }

  function signOut() {
    window.localStorage.removeItem(sessionStorageKey);
    setCurrentProfile(null);
    setPage("login");
  }

  if (page === "dashboard" && currentProfile) {
    return <Dashboard profile={currentProfile} onOpenProfile={() => setPage("profile")} />;
  }

  return (
    <AuthFlow
      key={page}
      mode={page === "dashboard" ? "login" : page}
      profiles={profiles}
      profile={page === "profile" ? currentProfile ?? undefined : undefined}
      onLogin={signIn}
      onRegister={register}
      onSaveProfile={saveProfile}
      onModeChange={setPage}
      onCancelProfile={() => setPage("dashboard")}
      onLogout={signOut}
    />
  );
}

export default App;
