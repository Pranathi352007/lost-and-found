
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/items";

function App() {
  const currentPath = window.location.pathname;
  const isHomePage = currentPath === "/";
  const isEventsPage = currentPath.startsWith("/events");
  const isLostFoundPage = currentPath.startsWith("/lost-found");

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
      contactEmail: String(formData.get("contactEmail") || "").trim(),
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
          <span className="brand-icon">L</span>
          <span>Campus Connect</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/lost-found">Lost &amp; Found</a>
          <a href="/lost-found#report">Report Item</a>
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
                <span className="hero-action-icon" aria-hidden="true">⌕</span>
                <span className="hero-action-copy">
                  <strong>Lost &amp; Found</strong>
                  <small>Find or report an item</small>
                </span>
                <span className="hero-action-arrow" aria-hidden="true">↗</span>
              </a>
              <a className="hero-action hero-action-secondary" href="/events">
                <span className="hero-action-icon" aria-hidden="true">✦</span>
                <span className="hero-action-copy">
                  <strong>Campus Events</strong>
                  <small>Explore what’s happening</small>
                </span>
                <span className="hero-action-arrow" aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="hero-footnote">
              <span className="footnote-dot" />
              Made for a more connected campus community
            </div>
          </div>
        </section>}

        {isLostFoundPage && <section className="items-section section" id="items">
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
              <div className="empty-icon" aria-hidden="true">⌕</div>
              <h3>No items reported yet</h3>
              <p>Be the first to share a report and help someone in your campus community.</p>
              <a className="button primary-button" href="/lost-found#report">Report an Item</a>
            </div>
          )}

          {!loading && !fetchError && items.length > 0 && !filtersApplied && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">⌕</div>
              <h3>Choose your filters</h3>
              <p>Search by item name, description, or location, or select a report type or category. Click Apply Filters to view matching items.</p>
            </div>
          )}

          {!loading && !fetchError && items.length > 0 && filtersApplied && (
            <>
              <p className="results-count">Showing {filteredItems.length} of {items.length} items</p>
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">⌕</div>
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
                        <div className="item-image-placeholder" aria-hidden="true">{item.type === "FOUND" ? "✓" : "?"}</div>
                      )}
                      <div className="item-card-content">
                        <div className="item-badges">
                          <span className={`status-badge ${item.type?.toLowerCase() || ""}`}>{item.type || "ITEM"}</span>
                          <span className="category-badge">{item.category || "Other"}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="item-description">{item.description || "No description provided."}</p>
                        <p className="item-detail"><strong>Location:</strong> {item.location || "Not specified"}</p>
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

        {isLostFoundPage && <section className="report-section section" id="report">
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
              <label>Contact Email <span className="required">*</span><input name="contactEmail" type="email" placeholder="you@example.com" maxLength={254} required /></label>
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
            <p>Stay curious, meet your community, and keep an eye on upcoming campus activities.</p>
          </div>
          <div className="event-placeholder">
            <div className="event-icon" aria-hidden="true">✦</div>
            <h3>Your next campus memory starts here</h3>
            <p>Event details and registration links will be shared here soon.</p>
          </div>
        </section>}
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="/"><span className="brand-icon">L</span><span>Campus Connect</span></a>
        <p>Small connections make campus life better.</p>
      </footer>
    </div>
  );
}

export default App;
