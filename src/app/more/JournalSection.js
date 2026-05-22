'use client';
import { useEffect, useState, useCallback } from 'react';

/* ============================================================
   Journal Section — public view + admin editor
   ============================================================ */

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return { month: '', day: '', weekday: '', year: '' };
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
    weekday: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
    year: d.getFullYear(),
  };
}
function paragraphs(text) {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   Read-only entry
   ============================================================ */
function ReadEntry({ entry, defaultOpen, admin, onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [open, setOpen] = useState(defaultOpen);
  const { month, day, weekday, year } = formatDate(entry.date);
  const paras = paragraphs(entry.body || '');
  const preview = paras[0] || '';
  const rest = paras.slice(1);
  const hasMore = rest.length > 0;

  return (
    <article className={`aero-more-entry ${open ? 'is-open' : ''}`}>
      <aside className="aero-more-entry-date" aria-hidden="true">
        <span className="aero-more-entry-month">{month}</span>
        <span className="aero-more-entry-day">{day}</span>
        <span className="aero-more-entry-weekday">
          {weekday} {year}
        </span>
      </aside>

      <div className="aero-more-entry-body">
        <header className="aero-more-entry-head">
          <h3 className="aero-more-entry-title">{entry.title}</h3>
          {entry.tags?.length > 0 && (
            <ul className="aero-more-entry-tags">
              {entry.tags.map((t) => (
                <li key={t}>#{t}</li>
              ))}
            </ul>
          )}
        </header>

        <div className="aero-more-entry-text">
          <p>{preview}</p>
          {hasMore && (
            <div className={`aero-more-entry-more ${open ? 'is-open' : ''}`} aria-hidden={!open}>
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>

        {hasMore && (
          <button
            type="button"
            className="aero-more-entry-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? '↑ collapse' : '↓ read more'}
          </button>
        )}

        {admin && (
          <div className="aero-more-entry-admin">
            <button type="button" className="aero-more-adm-btn" onClick={onMoveUp} disabled={!canMoveUp}>▲</button>
            <button type="button" className="aero-more-adm-btn" onClick={onMoveDown} disabled={!canMoveDown}>▼</button>
            <button type="button" className="aero-more-adm-btn" onClick={onEdit}>edit</button>
            <button type="button" className="aero-more-adm-btn aero-more-adm-btn--danger" onClick={onDelete}>delete</button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   Inline editor (create + edit)
   ============================================================ */
function EntryForm({ initial, onCancel, onSave, busy, submitLabel = 'save' }) {
  const [date, setDate] = useState(initial?.date || todayIso());
  const [title, setTitle] = useState(initial?.title || '');
  const [tagsStr, setTagsStr] = useState((initial?.tags || []).join(', '));
  const [body, setBody] = useState(initial?.body || '');

  function submit(e) {
    e.preventDefault();
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    onSave({ date, title, tags, body });
  }

  return (
    <form className="aero-more-form" onSubmit={submit}>
      <div className="aero-more-form-row">
        <label className="aero-more-form-label">
          date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="aero-more-form-label aero-more-form-label--grow">
          title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="entry title"
            required
          />
        </label>
      </div>
      <label className="aero-more-form-label">
        tags (comma-separated)
        <input
          type="text"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="design, travel"
        />
      </label>
      <label className="aero-more-form-label">
        body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="separate paragraphs with a blank line"
          required
        />
      </label>
      <div className="aero-more-form-actions">
        <button type="submit" className="aero-more-adm-btn aero-more-adm-btn--primary" disabled={busy}>
          {busy ? 'saving…' : submitLabel}
        </button>
        <button type="button" className="aero-more-adm-btn" onClick={onCancel} disabled={busy}>
          cancel
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Login modal
   ============================================================ */
function LoginModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || 'login failed');
      }
    } catch {
      setErr('network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="aero-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="aero-more-login" onClick={(e) => e.stopPropagation()}>
        <h3>admin · log in</h3>
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {err && <p className="aero-more-login-err">{err}</p>}
          <div className="aero-more-form-actions">
            <button type="submit" className="aero-more-adm-btn aero-more-adm-btn--primary" disabled={busy}>
              {busy ? 'checking…' : 'log in'}
            </button>
            <button type="button" className="aero-more-adm-btn" onClick={onClose} disabled={busy}>
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   Main section
   ============================================================ */
export default function JournalSection({ initialEntries = [] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [authed, setAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Check auth + refresh entries on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stat, list] = await Promise.all([
          fetch('/api/auth/status').then((r) => r.json()).catch(() => ({ authed: false })),
          fetch('/api/journal').then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        setAuthed(!!stat.authed);
        if (Array.isArray(list)) setEntries(list);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthed(false);
    setCreating(false);
    setEditingId(null);
  }, []);

  const onCreate = useCallback(async (data) => {
    setBusy(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.entries)) {
        setEntries(json.entries);
        setCreating(false);
      } else {
        alert(json.error || 'save failed');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const onUpdate = useCallback(async (id, data) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.entries)) {
        setEntries(json.entries);
        setEditingId(null);
      } else {
        alert(json.error || 'save failed');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const onDelete = useCallback(async (id) => {
    if (!confirm('Delete this entry?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.entries)) setEntries(json.entries);
      else alert(json.error || 'delete failed');
    } finally {
      setBusy(false);
    }
  }, []);

  const onMove = useCallback(async (id, direction) => {
    setBusy(true);
    try {
      const res = await fetch('/api/journal/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.entries)) setEntries(json.entries);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <section className="aero-more-journal" aria-labelledby="journal-heading">
      <div className="aero-more-section-head">
        <h2 id="journal-heading" className="aero-more-section-title">notebook</h2>
        <span className="aero-more-section-rule" />
        <span className="aero-more-section-count">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {authed && !creating && (
        <div className="aero-more-admin-bar">
          <span className="aero-more-admin-badge">admin · logged in</span>
          <button type="button" className="aero-more-adm-btn aero-more-adm-btn--primary" onClick={() => setCreating(true)} disabled={busy}>
            + new entry
          </button>
          <button type="button" className="aero-more-adm-btn" onClick={onLogout}>log out</button>
        </div>
      )}

      {authed && creating && (
        <div className="aero-more-entry aero-more-entry--editing">
          <div className="aero-more-entry-body">
            <h3 className="aero-more-entry-title">new entry</h3>
            <EntryForm
              onSave={onCreate}
              onCancel={() => setCreating(false)}
              busy={busy}
              submitLabel="publish"
            />
          </div>
        </div>
      )}

      <div className="aero-more-entries">
        {entries.map((entry, i) =>
          authed && editingId === entry.id ? (
            <div key={entry.id} className="aero-more-entry aero-more-entry--editing">
              <div className="aero-more-entry-body">
                <h3 className="aero-more-entry-title">editing</h3>
                <EntryForm
                  initial={entry}
                  onSave={(data) => onUpdate(entry.id, data)}
                  onCancel={() => setEditingId(null)}
                  busy={busy}
                  submitLabel="update"
                />
              </div>
            </div>
          ) : (
            <ReadEntry
              key={entry.id}
              entry={entry}
              defaultOpen={i === 0 && !authed}
              admin={authed}
              onEdit={() => setEditingId(entry.id)}
              onDelete={() => onDelete(entry.id)}
              onMoveUp={() => onMove(entry.id, 'up')}
              onMoveDown={() => onMove(entry.id, 'down')}
              canMoveUp={i > 0}
              canMoveDown={i < entries.length - 1}
            />
          )
        )}
      </div>

      <div className="aero-more-admin-footer">
        {authed ? (
          <button type="button" className="aero-more-admin-link" onClick={onLogout}>
            log out
          </button>
        ) : (
          <button type="button" className="aero-more-admin-link" onClick={() => setShowLogin(true)}>
            admin
          </button>
        )}
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setAuthed(true);
          }}
        />
      )}
    </section>
  );
}
