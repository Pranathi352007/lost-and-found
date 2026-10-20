
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
  const [itemLocationFilter, setItemLocationFilter] = useState("");
  const [itemDateFrom, setItemDateFrom] = useState("");
  const [itemDateTo, setItemDateTo] = useState("");
  const [revealedContacts, setRevealedContacts] = useState({});

  const [campusEvents, setCampusEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventClubFilter, setEventClubFilter] = useState("ALL");
  const [eventDateFilter, setEventDateFilter] = useState("UPCOMING");
  const [eventVenueFilter, setEventVenueFilter] = useState("");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("ALL");
  const [registrationMessage, setRegistrationMessage] = useState("");
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

  const eventClubs = [...new Set(campusEvents.map((event) => event.clubName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const filteredEvents = campusEvents.filter((campusEvent) => {
    const query = eventSearch.trim().toLowerCase();
    const matchesSearch = !query || [campusEvent.title, campusEvent.description, campusEvent.clubName, campusEvent.venue, campusEvent.createdBy]
      .some((value) => String(value || "").toLowerCase().includes(query));
    const matchesClub = eventClubFilter === "ALL" || campusEvent.clubName === eventClubFilter;
    const eventTime = campusEvent.eventDateTime ? new Date(campusEvent.eventDateTime).getTime() : null;
    const matchesDate = eventDateFilter === "ALL" || (eventTime !== null && (eventDateFilter === "UPCOMING" ? eventTime >= Date.now() : eventTime < Date.now()));
    const matchesVenue = !eventVenueFilter.trim() || String(campusEvent.venue || "").toLowerCase().includes(eventVenueFilter.trim().toLowerCase());
    const matchesCategory = eventCategoryFilter === "ALL" || campusEvent.category === eventCategoryFilter;
    return matchesSearch && matchesClub && matchesDate && matchesVenue && matchesCategory;
  });

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
      const response = await fetch(editingEventId ? `http://localhost:8080/api/events/${editingEventId}` : "http://localhost:8080/api/events", {
        method: editingEventId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + clubAccount.token,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add event.");
      setEventMessage(editingEventId ? "Event updated successfully!" : "Event added successfully!");
      setEditingEventId(null);
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
      const matchesLocation = !itemLocationFilter.trim() || String(item.location || "").toLowerCase().includes(itemLocationFilter.trim().toLowerCase());
      const reported = item.dateReported ? new Date(item.dateReported) : null;
      const matchesFrom = !itemDateFrom || (reported && reported >= new Date(itemDateFrom));
      const matchesTo = !itemDateTo || (reported && reported <= new Date(itemDateTo + "T23:59:59"));
      return matchesSearch && matchesType && matchesCategory && matchesLocation && matchesFrom && matchesTo;
    });
  }, [items, searchTerm, selectedType, selectedCategory, itemLocationFilter, itemDateFrom, itemDateTo]);

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
            <input type="search" aria-label="Filter by location" placeholder="Filter by location…" value={itemLocationFilter} onChange={(event) => setItemLocationFilter(event.target.value)} />
            <label className="filter-date-label">Reported from<input type="date" value={itemDateFrom} onChange={(event) => setItemDateFrom(event.target.value)} /></label>
            <label className="filter-date-label">Reported to<input type="date" value={itemDateTo} onChange={(event) => setItemDateTo(event.target.value)} /></label>
            <button className="button primary-button" type="button" onClick={() => setFiltersApplied(true)}>Apply Filters</button>
            <button className="button outline-button" type="button" onClick={() => { setSearchTerm(""); setSelectedType("ALL"); setSelectedCategory("ALL"); setItemLocationFilter(""); setItemDateFrom(""); setItemDateTo(""); setFiltersApplied(false); }}>Clear Filters</button>
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
                        {item.status !== "RETURNED" && <button className="button outline-button item-return-button" type="button" onClick={async () => { if (!window.confirm("Mark this item as returned?")) return; try { const response = await fetch(`${API_URL}/${item.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "RETURNED" }) }); if (!response.ok) throw new Error(); const updated = await response.json(); setItems((previous) => previous.map((entry) => entry.id === item.id ? updated : entry)); } catch { setFetchError("Could not update item status. Check the backend and try again."); } }}><CheckCircle2 size={15} /> Mark as Returned</button>}
                        {(item.contactName || item.contactPhone) && <div className="item-contact"><button type="button" className="text-button" onClick={() => setRevealedContacts((previous) => ({ ...previous, [item.id]: !previous[item.id] }))}>{revealedContacts[item.id] ? "Hide contact details" : "Show contact details"}</button>{revealedContacts[item.id] && <p className="item-detail">{item.contactName && <>Name: {item.contactName}<br /></>}{item.contactPhone && <>Phone: {item.contactPhone}</>}</p>}</div> }
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
              <label className="full-width">Item Photo (optional)<input name="photoFile" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 900000) { setFormError("Please choose an image smaller than 900 KB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => { const hidden = event.target.form?.elements.namedItem("imageUrl"); if (hidden) hidden.value = String(reader.result || ""); }; reader.readAsDataURL(file); }} /><input type="hidden" name="imageUrl" /></label>
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
            <p>Search and filter campus events by keyword, club, date, or venue.</p>
          </div>
          <div className="search-filters event-search-filters">
            <input type="search" aria-label="Search events" placeholder="Search event name or description…" value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} />
            <select aria-label="Filter events by club" value={eventClubFilter} onChange={(event) => setEventClubFilter(event.target.value)}>
              <option value="ALL">All Clubs</option>
              {eventClubs.map((club) => <option key={club} value={club}>{club}</option>)}
            </select>
            <select aria-label="Filter events by date" value={eventDateFilter} onChange={(event) => setEventDateFilter(event.target.value)}>
              <option value="UPCOMING">Upcoming Events</option>
              <option value="PAST">Past Events</option>
              <option value="ALL">All Dates</option>
            </select>
            <input type="search" aria-label="Filter events by venue" placeholder="Filter by venue…" value={eventVenueFilter} onChange={(event) => setEventVenueFilter(event.target.value)} />
            <select aria-label="Filter events by category" value={eventCategoryFilter} onChange={(event) => setEventCategoryFilter(event.target.value)}><option value="ALL">All Categories</option><option value="WORKSHOP">Workshop</option><option value="CULTURAL">Cultural</option><option value="TECHNICAL">Technical</option><option value="SPORTS">Sports</option><option value="OTHER">Other</option></select>
            <button className="button outline-button" type="button" onClick={() => { setEventSearch(""); setEventClubFilter("ALL"); setEventDateFilter("UPCOMING"); setEventVenueFilter(""); setEventCategoryFilter("ALL"); }}>Clear Filters</button>
          </div>
          {eventsLoading && <p className="info-message">Loading events…</p>}
          {eventsError && <div className="message error-message">{eventsError}</div>}
          {!eventsLoading && !eventsError && campusEvents.length === 0 && (
            <div className="event-placeholder">
              <div className="event-icon"><CalendarDays size={30} /></div>
              <h3>No events have been added yet</h3>
              <p>There are no campus events to show right now. Please check again later.</p>
            </div>
          )}
          {!eventsLoading && !eventsError && campusEvents.length > 0 && filteredEvents.length === 0 && (
            <div className="event-placeholder">
              <div className="event-icon"><Search size={30} /></div>
              <h3>No matching events found</h3>
              <p>Try changing your search words or filters.</p>
              <button className="button outline-button" type="button" onClick={() => { setEventSearch(""); setEventClubFilter("ALL"); setEventDateFilter("ALL"); setEventVenueFilter(""); }}>Show All Events</button>
            </div>
          )}
          <p className="results-count">{!eventsLoading && !eventsError && campusEvents.length > 0 ? `Showing ${filteredEvents.length} of ${campusEvents.length} events` : ""}</p>
          <div className="event-list-grid">
            {filteredEvents.map((campusEvent) => (
              <article className="campus-event-card" key={campusEvent.id}>
                <div className="campus-event-card-top">
                  <span className="icon-tile icon-pink"><CalendarDays size={23} /></span>
                  <span className="event-club-pill">{campusEvent.clubName || "Campus Club"}</span>
                </div>
                {campusEvent.posterUrl && <img className="campus-event-poster" src={campusEvent.posterUrl} alt={`${campusEvent.title} poster`} />}
                <h3>{campusEvent.title}</h3>
                <p>{campusEvent.description || "More details will be announced soon."}</p>
                {campusEvent.eventDateTime && <p className="event-meta"><CalendarDays size={16} /> {new Date(campusEvent.eventDateTime).toLocaleString()}</p>}
                {campusEvent.venue && <p className="event-meta"><MapPin size={16} /> {campusEvent.venue}</p>}
                <p className="event-meta"><UserRound size={16} /> Posted by {campusEvent.createdBy || campusEvent.clubName}</p>
                {campusEvent.registrationUrl && <a className="event-registration-link" href={campusEvent.registrationUrl} target="_blank" rel="noreferrer">Registration link <ExternalLink size={15} /></a>}
                <button className="button primary-button event-register-button" type="button" onClick={async () => { const studentName = window.prompt("Enter your full name to register:"); if (!studentName?.trim()) return; const registrationNumber = window.prompt("Enter your student registration number:"); if (!registrationNumber?.trim()) return; try { const response = await fetch(`http://localhost:8080/api/events/${campusEvent.id}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentName: studentName.trim(), registrationNumber: registrationNumber.trim() }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Registration failed."); setRegistrationMessage(`Registered successfully for ${campusEvent.title}.`); } catch (error) { setRegistrationMessage(error.message || "Could not register."); } }}>Register for Event</button>
                {registrationMessage && <p className="message success-message">{registrationMessage}</p>}
                {clubAccount && String(clubAccount.clubName || "").toLowerCase() === String(campusEvent.clubName || "").toLowerCase() && <div className="event-owner-actions"><button className="button outline-button" type="button" onClick={async () => { const title = window.prompt("Event title:", campusEvent.title); if (title === null || !title.trim()) return; const description = window.prompt("Description:", campusEvent.description || "") ?? campusEvent.description ?? ""; const venue = window.prompt("Venue:", campusEvent.venue || "") ?? campusEvent.venue ?? ""; const date = window.prompt("Date and time (YYYY-MM-DDTHH:mm):", campusEvent.eventDateTime ? String(campusEvent.eventDateTime).slice(0,16) : "") ; if (date === null) return; const registrationUrl = window.prompt("Registration URL:", campusEvent.registrationUrl || "") ?? campusEvent.registrationUrl ?? ""; try { const response = await fetch(`http://localhost:8080/api/events/${campusEvent.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + clubAccount.token }, body: JSON.stringify({ title, description, venue, eventDateTime: date, registrationUrl, category: campusEvent.category || "OTHER", posterUrl: campusEvent.posterUrl || "" }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Could not update event."); setCampusEvents((previous) => previous.map((entry) => entry.id === campusEvent.id ? result : entry)); } catch (error) { setEventsError(error.message || "Could not update event."); } }}>Edit Event</button><button className="button danger-button" type="button" onClick={async () => { if (!window.confirm("Cancel and delete this event?")) return; try { const response = await fetch(`http://localhost:8080/api/events/${campusEvent.id}`, { method: "DELETE", headers: { Authorization: "Bearer " + clubAccount.token } }); if (!response.ok) throw new Error(); setCampusEvents((previous) => previous.filter((entry) => entry.id !== campusEvent.id)); } catch { setEventsError("Could not cancel event. Please log in as the event-owning club."); } }}>Cancel Event</button></div>}
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
                  <label>Category<select name="category" defaultValue="OTHER" required><option value="WORKSHOP">Workshop</option><option value="CULTURAL">Cultural</option><option value="TECHNICAL">Technical</option><option value="SPORTS">Sports</option><option value="OTHER">Other</option></select></label>
                  <label>Date and Time<input name="eventDateTime" type="datetime-local" /></label>
                  <label>Venue<input name="venue" maxLength={200} placeholder="e.g. Seminar Hall" /></label>
                  <label className="full-width">Event Poster (optional)<input name="posterFile" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 900000) { setEventError("Please choose a poster smaller than 900 KB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => { const hidden = event.target.form?.elements.namedItem("posterUrl"); if (hidden) hidden.value = String(reader.result || ""); }; reader.readAsDataURL(file); }} /><input type="hidden" name="posterUrl" /></label>
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
