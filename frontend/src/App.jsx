
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  PlusCircle,
  MapPin,
  Package,
  ArrowUpRight,
  Sparkles,
  CheckCircle,
  CircleHelp,
  UserRound,
  LogIn,
  UserPlus,
  CalendarPlus,
  LogOut,
  Trash2,
  ExternalLink,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:8080/api/items";

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const isHomePage = currentPath === "/";
  const isEventsPage = currentPath === "/events";
  const isFindEventsPage = currentPath === "/find-events";
  const isAddEventsPage = currentPath === "/add-events";
  const isLostFoundPage = currentPath === "/lost-found";
  const isFindItemsPage = currentPath === "/find-items";
  const isReportItemPage = currentPath === "/report-item";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [filtersApplied, setFiltersApplied] = useState(false);

  const [campusEvents, setCampusEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [eventMode, setEventMode] = useState("choose");
  const [eventMessage, setEventMessage] = useState("");
  const [eventError, setEventError] = useState("");
  const [eventBusy, setEventBusy] = useState(false);
  const [clubAccount, setClubAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campusClubAccount") || "null");
    } catch {
      return null;
    }
  });

  async function loadEvents() {
    setEventsLoading(true);
    setEventsError("");
    try {
      const response = await fetch("http://localhost:8080/api/events");
      if (!response.ok) throw new Error("Could not load campus events.");
      setCampusEvents(await response.json());
    } catch {
      setEventsError("Unable to load events. Check that the backend is running.");
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    if (isFindEventsPage) loadEvents();
  }, [isFindEventsPage]);

  async function handleClubSignup(event) {
    event.preventDefault();
    setEventError("");
    setEventMessage("");
    setEventBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("http://localhost:8080/api/club-accounts/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not create account.");
      localStorage.setItem("campusClubAccount", JSON.stringify(result));
      setClubAccount(result);
      setEventMode("dashboard");
      setEventMessage("Account created successfully. You can now add campus events.");
    } catch (error) {
      setEventError(error.message || "Sign-up failed. Please try again.");
    } finally {
      setEventBusy(false);
    }
  }

  async function handleClubLogin(event) {
    event.preventDefault();
    setEventError("");
    setEventMessage("");
    setEventBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("http://localhost:8080/api/club-accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Login failed.");
      localStorage.setItem("campusClubAccount", JSON.stringify(result));
      setClubAccount(result);
      setEventMode("dashboard");
      setEventMessage("Welcome back. You can now add campus events.");
    } catch (error) {
      setEventError(error.message || "Login failed. Please try again.");
    } finally {
      setEventBusy(false);
    }
  }

  async function handleCreateEvent(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setEventError("");
    setEventMessage("");
    setEventBusy(true);
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("http://localhost:8080/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + clubAccount.token,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add event.");
      setEventMessage("Event added successfully!");
      formElement.reset();
    } catch (error) {
      setEventError(error.message || "Could not add event. Please try again.");
    } finally {
      setEventBusy(false);
    }
  }

  function handleClubLogout() {
    localStorage.removeItem("campusClubAccount");
    setClubAccount(null);
    setEventMode("choose");
    setEventMessage("You have logged out.");
    setEventError("");
  }

  async function handleDeleteClubAccount() {
    if (!window.confirm("Delete your coordinator account? This frees your club role for another person. This action cannot be undone.")) return;
    setEventError("");
    setEventMessage("");
    setEventBusy(true);
    try {
      const response = await fetch("http://localhost:8080/api/club-accounts/me", {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + clubAccount.token },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not delete account.");
      localStorage.removeItem("campusClubAccount");
      setClubAccount(null);
      setEventMode("choose");
      setEventMessage(result.message || "Account deleted.");
    } catch (error) {
      setEventError(error.message || "Could not delete account.");
    } finally {
      setEventBusy(false);
    }
  }

  async function loadItems() {
    try {
      setFetchError("");
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Could not load items.");
      setItems(await response.json());
    } catch {
      setFetchError("Unable to load items. Please check that the Spring Boot backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        [item.title, item.description, item.location].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      const matchesType = selectedType === "ALL" || item.type === selectedType;
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [items, searchTerm, selectedType, selectedCategory]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setFormError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const item = {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      category: formData.get("category"),
      type: formData.get("type"),
      location: String(formData.get("location") || "").trim(),
      contactName: String(formData.get("contactName") || "").trim(),
      contactPhone: String(formData.get("contactPhone") || "").trim(),
      status: "OPEN",
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("The server could not save your report.");
      const savedItem = await response.json();
      setItems((previousItems) => [savedItem, ...previousItems]);
      setMessage("Your item has been reported successfully!");
      form.reset();
    } catch {
      setFormError("Could not submit your report. Check the backend and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/" aria-label="Lost and Found home">
          <span className="brand-icon"><Package size={21} fill="currentColor" /></span>
          <span>Campus Connect</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/lost-found">Lost &amp; Found</a>
          <a href="/report-item">Report Item</a>
          <a href="/events">Events</a>
        </nav>
      </header>

      <main>
        {isHomePage && <section className="hero" id="home">
          <div className="hero-orb hero-orb-one" aria-hidden="true" />
          <div className="hero-orb hero-orb-two" aria-hidden="true" />
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">YOUR CAMPUS, CONNECTED</span>
            <h1>
              Find what matters.
              <br />
              <span>Be part of campus life.</span>
            </h1>
            <p className="hero-description">
              A friendly campus space to reconnect people with their belongings
              and discover what’s happening around you.
            </p>

            <div className="hero-buttons">
              <a className="hero-action hero-action-primary" href="/lost-found">
                <span className="hero-action-icon" aria-hidden="true"><Search size={23} strokeWidth={2.5} /></span>
                <span className="hero-action-copy">
                  <strong>Lost &amp; Found</strong>
                  <small>Find or report an item</small>
                </span>
                <span className="hero-action-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
              </a>
              <a className="hero-action hero-action-secondary" href="/events">
                <span className="hero-action-icon" aria-hidden="true"><CalendarDays size={23} strokeWidth={2.5} /></span>
                <span className="hero-action-copy">
                  <strong>Campus Events</strong>
                  <small>Explore what’s happening</small>
                </span>
                <span className="hero-action-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
              </a>
            </div>

            <div className="hero-footnote">
              <span className="footnote-dot" />
              Made for a more connected campus community
            </div>
          </div>
        </section>}

        {isLostFoundPage && <section className="section" id="lost-found-options">
          <div className="section-heading">
            <span className="eyebrow">LOST SOMETHING OR FOUND SOMETHING?</span>
            <h2>Lost &amp; Found</h2>
            <p>Choose what you would like to do. You can browse reported items or submit a new report.</p>
          </div>
          <div className="hero-buttons">
            <a className="hero-action hero-action-primary" href="/find-items">
              <span className="hero-action-icon" aria-hidden="true"><Search size={23} strokeWidth={2.5} /></span>
              <span className="hero-action-copy">
                <strong>Find a Lost Item</strong>
                <small>Search and filter reported items</small>
              </span>
              <span className="hero-action-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </a>
            <a className="hero-action hero-action-secondary" href="/report-item">
              <span className="hero-action-icon" aria-hidden="true"><PlusCircle size={23} strokeWidth={2.5} /></span>
              <span className="hero-action-copy">
                <strong>Report an Item</strong>
                <small>Tell the campus what you lost or found</small>
              </span>
              <span className="hero-action-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </a>
          </div>
        </section>}

        {isFindItemsPage && <section className="items-section section" id="items">
          <div className="section-heading">
            <span className="eyebrow">THE COMMUNITY BOARD</span>
            <h2>Lost &amp; Found</h2>
            <p>Search recent reports, or share details about something you lost or found.</p>
          </div>

          <div className="search-filters">
            <input type="search" aria-label="Search items" placeholder="Search name, description, or location…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            <select aria-label="Filter by report type" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="ALL">All Items</option>
              <option value="LOST">Lost Items</option>
              <option value="FOUND">Found Items</option>
            </select>
            <select aria-label="Filter by category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Books">Books and Notes</option>
              <option value="Bags">Bags</option>
              <option value="ID Cards">ID Cards</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Keys">Keys</option>
              <option value="Other">Other</option>
            </select>
            <button className="button primary-button" type="button" onClick={() => setFiltersApplied(true)}>Apply Filters</button>
            <button className="button outline-button" type="button" onClick={() => { setSearchTerm(""); setSelectedType("ALL"); setSelectedCategory("ALL"); setFiltersApplied(false); }}>Clear Filters</button>
          </div>

          {loading && <p className="info-message">Loading items…</p>}
          {!loading && fetchError && <div className="message error-message">{fetchError}</div>}

          {!loading && !fetchError && items.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true"><Search size={29} strokeWidth={2.4} /></div>
              <h3>No items reported yet</h3>
              <p>Be the first to share a report and help someone in your campus community.</p>
              <a className="button primary-button" href="/report-item">Report an Item</a>
            </div>
          )}

          {!loading && !fetchError && items.length > 0 && !filtersApplied && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true"><Search size={29} strokeWidth={2.4} /></div>
              <h3>Choose your filters</h3>
              <p>Search by item name, description, or location, or select a report type or category. Click Apply Filters to view matching items.</p>
            </div>
          )}

          {!loading && !fetchError && items.length > 0 && filtersApplied && (
            <>
              <p className="results-count">Showing {filteredItems.length} of {items.length} items</p>
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true"><Search size={29} strokeWidth={2.4} /></div>
                  <h3>No matching items found</h3>
                  <p>Try a different search phrase or update your filters.</p>
                </div>
              ) : (
                <div className="items-grid">
                  {filteredItems.map((item) => (
                    <article className="item-card" key={item.id}>
                      {item.imageUrl ? (
                        <img className="item-image" src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="item-image-placeholder" aria-hidden="true">{item.type === "FOUND" ? <CheckCircle size={46} /> : <CircleHelp size={46} />}</div>
                      )}
                      <div className="item-card-content">
                        <div className="item-badges">
                          <span className={`status-badge ${item.type?.toLowerCase() || ""}`}>{item.type || "ITEM"}</span>
                          <span className="category-badge">{item.category || "Other"}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="item-description">{item.description || "No description provided."}</p>
                        <p className="item-detail item-location"><MapPin size={15} /><strong>Location:</strong> {item.location || "Not specified"}</p>
                        <p className="item-detail"><strong>Status:</strong> {item.status || "OPEN"}</p>
                        {item.dateReported && <p className="item-date">Reported: {new Date(item.dateReported).toLocaleDateString()}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <button className="button outline-button" type="button" onClick={loadItems}>Refresh Items</button>
            </>
          )}
        </section>}

        {isReportItemPage && <section className="report-section section" id="report">
          <div className="section-heading">
            <span className="eyebrow">HELP SOMEONE RECONNECT</span>
            <h2>Report an Item</h2>
            <p>Share a few details so others can help identify a lost or found belonging.</p>
          </div>
          <form className="report-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>Item Title <span className="required">*</span><input name="title" type="text" placeholder="e.g. Black water bottle" maxLength={150} required /></label>
              <label>Report Type <span className="required">*</span><select name="type" defaultValue="LOST" required><option value="LOST">I lost an item</option><option value="FOUND">I found an item</option></select></label>
              <label>Category <span className="required">*</span><select name="category" defaultValue="" required><option value="" disabled>Select a category</option><option value="Electronics">Electronics</option><option value="Books">Books and Notes</option><option value="Bags">Bags</option><option value="ID Cards">ID Cards</option><option value="Clothing">Clothing</option><option value="Accessories">Accessories</option><option value="Keys">Keys</option><option value="Other">Other</option></select></label>
              <label>Location <span className="required">*</span><input name="location" type="text" placeholder="e.g. College library" maxLength={200} required /></label>
              <label className="full-width">Description <span className="required">*</span><textarea name="description" placeholder="Describe the item and identifying details…" rows={4} maxLength={1000} required /></label>
              <label>Your Name <span className="required">*</span><input name="contactName" type="text" placeholder="Enter your name" maxLength={100} required /></label>
              <label>Phone Number <span className="required">*</span><input name="contactPhone" type="tel" placeholder="Enter your phone number" maxLength={20} pattern="[0-9+()\-\s]{7,20}" title="Enter a valid phone number" required /></label>
            </div>
            {message && <div className="message success-message" role="status">{message}</div>}
            {formError && <div className="message error-message" role="alert">{formError}</div>}
            <button className="button primary-button submit-button" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Report"}</button>
            <p className="privacy-note">Use test contact details while developing. This version does not yet include authentication or private contact-information controls.</p>
          </form>
        </section>}

        {isEventsPage && <section className="events-section section" id="events">
          <div className="section-heading">
            <span className="eyebrow">MEET, LEARN &amp; CELEBRATE</span>
            <h2>Campus Events</h2>
            <p>Discover activities around campus or sign in as a club coordinator to publish an event.</p>
          </div>
          <div className="event-choice-grid">
            <a className="event-choice-card event-choice-find" href="/find-events">
              <span className="event-choice-icon"><Search size={30} /></span>
              <h3>Find Events</h3>
              <p>Browse upcoming events, venues, and registration links.</p>
              <span className="event-choice-link">Explore events <ArrowUpRight size={18} /></span>
            </a>
            <a className="event-choice-card event-choice-add" href="/add-events">
              <span className="event-choice-icon"><CalendarPlus size={30} /></span>
              <h3>Add Events</h3>
              <p>Log in or sign up as your club's coordinator to post events.</p>
              <span className="event-choice-link">Coordinator access <ArrowUpRight size={18} /></span>
            </a>
          </div>
        </section>}

        {isFindEventsPage && <section className="events-section section">
          <div className="section-heading">
            <span className="eyebrow">CAMPUS CALENDAR</span>
            <h2>Find Events</h2>
            <p>Explore activities shared by campus clubs.</p>
          </div>
          {eventsLoading && <p className="info-message">Loading events…</p>}
          {eventsError && <div className="message error-message">{eventsError}</div>}
          {!eventsLoading && !eventsError && campusEvents.length === 0 && (
            <div className="event-placeholder">
              <div className="event-icon"><CalendarDays size={30} /></div>
              <h3>No events have been added yet</h3>
              <p>Check back later, or sign in as a club coordinator to publish an event.</p>
              <a className="button primary-button" href="/add-events">Add an Event</a>
            </div>
          )}
          <div className="event-list-grid">
            {campusEvents.map((campusEvent) => (
              <article className="campus-event-card" key={campusEvent.id}>
                <div className="campus-event-card-top">
                  <span className="icon-tile icon-pink"><CalendarDays size={23} /></span>
                  <span className="event-club-pill">{campusEvent.clubName || "Campus Club"}</span>
                </div>
                <h3>{campusEvent.title}</h3>
                <p>{campusEvent.description || "More details will be announced soon."}</p>
                {campusEvent.eventDateTime && <p className="event-meta"><CalendarDays size={16} /> {new Date(campusEvent.eventDateTime).toLocaleString()}</p>}
                {campusEvent.venue && <p className="event-meta"><MapPin size={16} /> {campusEvent.venue}</p>}
                <p className="event-meta"><UserRound size={16} /> Posted by {campusEvent.createdBy || campusEvent.clubName}</p>
                {campusEvent.registrationUrl && <a className="event-registration-link" href={campusEvent.registrationUrl} target="_blank" rel="noreferrer">Registration link <ExternalLink size={15} /></a>}
              </article>
            ))}
          </div>
          <a className="button outline-button event-back-button" href="/events">Back to Events</a>
        </section>}

        {isAddEventsPage && <section className="events-section section">
          <div className="section-heading">
            <span className="eyebrow">CLUB COORDINATOR PORTAL</span>
            <h2>Add Campus Events</h2>
            <p>Each club can register one Club Coordinator and one Sub Coordinator. A role becomes available again when its account is deleted.</p>
          </div>
          {!clubAccount && eventMode === "choose" && (
            <div className="event-auth-choice">
              <button className="button primary-button" type="button" onClick={() => { setEventMode("login"); setEventError(""); setEventMessage(""); }}><LogIn size={18} /> Log In</button>
              <button className="button outline-button" type="button" onClick={() => { setEventMode("signup"); setEventError(""); setEventMessage(""); }}><UserPlus size={18} /> Sign Up</button>
            </div>
          )}
          {!clubAccount && eventMode === "login" && (
            <form className="report-form event-form" onSubmit={handleClubLogin}>
              <h3><LogIn size={21} /> Coordinator Login</h3>
              <label>Registration Number <span className="required">*</span><input name="registrationNumber" autoComplete="username" required /></label>
              <label>Password <span className="required">*</span><input name="password" type="password" autoComplete="current-password" required /></label>
              {eventError && <div className="message error-message">{eventError}</div>}
              {eventMessage && <div className="message success-message">{eventMessage}</div>}
              <button className="button primary-button submit-button" disabled={eventBusy}>{eventBusy ? "Logging in…" : "Log In"}</button>
              <button className="text-button" type="button" onClick={() => { setEventMode("signup"); setEventError(""); setEventMessage(""); }}>New coordinator? Sign up</button>
              <button className="text-button" type="button" onClick={() => { setEventMode("choose"); setEventError(""); setEventMessage(""); }}>Back</button>
            </form>
          )}
          {!clubAccount && eventMode === "signup" && (
            <form className="report-form event-form" onSubmit={handleClubSignup}>
              <h3><UserPlus size={21} /> Club Coordinator Sign Up</h3>
              <div className="form-grid">
                <label>Full Name <span className="required">*</span><input name="fullName" autoComplete="name" maxLength={100} required /></label>
                <label>Registration Number <span className="required">*</span><input name="registrationNumber" autoComplete="username" maxLength={40} required /></label>
                <label>Email Address <span className="required">*</span><input name="email" type="email" autoComplete="email" required /></label>
                <label>Phone Number<input name="phone" type="tel" maxLength={20} /></label>
                <label>Department / Branch<input name="department" maxLength={100} /></label>
                <label>Year of Study<input name="yearOfStudy" placeholder="e.g. 2nd year" maxLength={30} /></label>
                <label>Club Name <span className="required">*</span><input name="clubName" placeholder="Enter the official club name" maxLength={100} required /></label>
                <label>Club Role <span className="required">*</span><select name="role" defaultValue="COORDINATOR" required><option value="COORDINATOR">Club Coordinator</option><option value="SUB_COORDINATOR">Sub Coordinator</option></select></label>
                <label className="full-width">Password <span className="required">*</span><input name="password" type="password" minLength={8} autoComplete="new-password" required /><small>Use at least 8 characters.</small></label>
              </div>
              {eventError && <div className="message error-message">{eventError}</div>}
              {eventMessage && <div className="message success-message">{eventMessage}</div>}
              <button className="button primary-button submit-button" disabled={eventBusy}>{eventBusy ? "Creating account…" : "Create Account"}</button>
              <button className="text-button" type="button" onClick={() => { setEventMode("login"); setEventError(""); setEventMessage(""); }}>Already registered? Log in</button>
              <button className="text-button" type="button" onClick={() => { setEventMode("choose"); setEventError(""); setEventMessage(""); }}>Back</button>
            </form>
          )}
          {clubAccount && (
            <div className="event-dashboard">
              <div className="event-account-banner">
                <span className="icon-tile icon-purple"><UserRound size={25} /></span>
                <div><h3>Welcome, {clubAccount.fullName}</h3><p>{clubAccount.clubName} · {clubAccount.role === "COORDINATOR" ? "Club Coordinator" : "Sub Coordinator"}</p></div>
              </div>
              {eventError && <div className="message error-message">{eventError}</div>}
              {eventMessage && <div className="message success-message">{eventMessage}</div>}
              <form className="report-form event-form" onSubmit={handleCreateEvent}>
                <h3><CalendarPlus size={21} /> Add a New Event</h3>
                <label>Event Title <span className="required">*</span><input name="title" maxLength={150} required /></label>
                <label>Description<textarea name="description" rows={4} maxLength={2000} placeholder="Tell students what the event is about." /></label>
                <div className="form-grid">
                  <label>Date and Time<input name="eventDateTime" type="datetime-local" /></label>
                  <label>Venue<input name="venue" maxLength={200} placeholder="e.g. Seminar Hall" /></label>
                  <label className="full-width">Registration URL<input name="registrationUrl" type="url" placeholder="https://forms.gle/..." /></label>
                </div>
                <button className="button primary-button submit-button" disabled={eventBusy}>{eventBusy ? "Publishing…" : "Publish Event"}</button>
              </form>
              <div className="event-account-actions">
                <button className="button outline-button" type="button" onClick={handleClubLogout}><LogOut size={17} /> Log Out</button>
                <button className="button danger-button" type="button" onClick={handleDeleteClubAccount} disabled={eventBusy}><Trash2 size={17} /> Delete Account</button>
              </div>
              <p className="privacy-note">Deleting your account permanently releases this club role for another sign-up. Events already published will remain visible.</p>
            </div>
          )}
          <a className="button outline-button event-back-button" href="/events">Back to Events</a>
        </section>}
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="/"><span className="brand-icon"><Package size={21} fill="currentColor" /></span><span>Campus Connect</span></a>
        <p>Small connections make campus life better.</p>
      </footer>
    </div>
  );
}

export default App;
