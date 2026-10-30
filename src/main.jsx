import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { berlinDay, shiftDay, validDay, yearDays, stats } from './dates';
import './style.css';

const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const db = configured ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY) : null;
const colors = ['#ed7669', '#d7ae65', '#91bba0', '#88a9d3', '#b19bd0'];
const pretty = day => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
function demoHabits() {
  const today = berlinDay();
  return ['Read a little', 'Move my body', 'Make time to reflect'].map((name, i) => ({ id: `demo-${i}`, name, color: colors[i], completed: Array.from({ length: 150 }, (_, n) => shiftDay(today, -n)).filter((_, n) => (n * 7 + i * 3) % 11 < 7 - i) }));
}
function App() {
  const [today, setToday] = useState(berlinDay());
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [session, setSession] = useState(null), [demo, setDemo] = useState(false);
  const [habits, setHabits] = useState([]), [loading, setLoading] = useState(configured);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null), [selection, setSelection] = useState(null), [remove, setRemove] = useState(null);
  const [password, setPassword] = useState('');
  const lock = useRef(false);
  const active = Boolean(session) || demo;
  useEffect(() => {
    const timer = setInterval(() => setToday(berlinDay()), 30000);
    if (!db) return () => clearInterval(timer);
    db.auth.getSession().then(({ data, error }) => { if (error) setError(error.message); setSession(data.session); setLoading(Boolean(data.session)); });
    const { data } = db.auth.onAuthStateChange((_event, value) => { setLoading(Boolean(value)); setSession(value); });
    return () => { clearInterval(timer); data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await db.from('habits').select('id,name,color,completions(day)').order('created_at');
      if (cancelled) return;
      if (error) setError(error.message);
      else setHabits(data.map(h => ({ ...h, completed: h.completions.map(c => c.day) })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);
  useEffect(() => {
    if (!active || loading) return;
    const query = new URLSearchParams(location.search);
    const id = query.get('habit'), day = query.get('day');
    if (!id) return;
    if (validDay(day) && day <= today && habits.some(h => h.id === id)) {
      setYear(Number(day.slice(0, 4))); setSelection({ id, day });
    } else setError('This check-in link is unavailable. You can still select a day in your calendar.');
    history.replaceState(null, '', location.pathname);
  }, [active, loading, habits, today]);
  async function perform(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e.message || 'Something went wrong. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function check(result) { if (result.error) throw result.error; return result.data; }
  async function saveHabit(event) {
    event.preventDefault();
    const { id, name, color } = editor;
    if (!name.trim() || !/^#[0-9a-f]{6}$/i.test(color)) { setError('Enter a name and a six-digit hex color.'); return; }
    await perform(async () => {
      const values = { name: name.trim(), color };
      if (id) {
        if (!demo) check(await db.from('habits').update(values).eq('id', id).select().single());
        setHabits(old => old.map(h => h.id === id ? { ...h, ...values } : h));
      } else {
        const created = demo ? { id: crypto.randomUUID(), ...values } : check(await db.from('habits').insert({ ...values, user_id: session.user.id }).select().single());
        setHabits(old => [...old, { ...created, completed: [] }]);
      }
      setEditor(null);
    });
  }
  async function mark(id, day, done) {
    await perform(async () => {
      if (!validDay(day) || day > today) throw new Error('Choose today or a past day.');
      if (!demo) check(done ? await db.from('completions').upsert({ habit_id: id, day }, { onConflict: 'habit_id,day' }) : await db.from('completions').delete().eq('habit_id', id).eq('day', day));
      setHabits(old => old.map(h => h.id === id ? { ...h, completed: done ? [...new Set([...h.completed, day])] : h.completed.filter(d => d !== day) } : h));
      setSelection(null);
    });
  }
  const totalToday = habits.filter(h => h.completed.includes(today)).length;
  const selectedHabit = habits.find(h => h.id === selection?.id);
  return <div className="shell">
    <header className="topbar"><a className="brand" href={location.pathname}><span className="brand-mark">▦</span> small steps<span className="brand-dot">.</span></a><div className="top-actions"><span className="timezone">◷ &nbsp; Europe / Berlin</span>{active && <button className="text-button" onClick={() => perform(async () => { if (!demo) check(await db.auth.signOut()); setDemo(false); setSession(null); setHabits([]); })}>{demo ? 'Exit preview' : 'Sign out'} ↗</button>}</div></header>
    {error && <div className="alert" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
    {!active ? <main className="welcome"><div className="eyebrow">A LITTLE, EVERY DAY</div><h1>Good things<br/>take practice<span>.</span></h1><p>A quiet place for your habits. Build momentum,<br className="desktop"/> one small square at a time.</p><div className="login-card"><h2>Your personal habit journal</h2>{configured ? <form onSubmit={e => { e.preventDefault(); perform(async () => { check(await db.auth.signInWithPassword({ email: 'robin04102003@gmail.com', password })); setPassword(''); }); }}><label>Email<input type="email" value="robin04102003@gmail.com" readOnly autoComplete="username"/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label><button className="primary" disabled={busy || loading}>{loading ? 'Connecting…' : busy ? 'Signing in…' : 'Open my journal →'}</button></form> : <p>Connect Supabase to start your private journal. In the meantime, explore an interactive preview.</p>}<button className="text-button preview-button" onClick={() => { setDemo(true); setHabits(demoHabits()); setLoading(false); }}>Explore the preview ↗</button><small>Private by design. Progress at your own pace.</small></div></main> : <main>
      {demo && <div className="demo-banner"><span>PREVIEW MODE</span> Sample habits · Changes last until you leave this preview.</div>}
      <section className="intro"><div><div className="eyebrow">YOUR EVERYDAY PRACTICE</div><h1>Small steps. Real progress.</h1><p>You don’t need a perfect streak. Just a place to start again.</p></div><button className="primary" onClick={() => setEditor({ name: '', color: colors[0] })}>＋ New habit</button></section>
      <section className="overview"><div><span className="eyebrow">TODAY · {new Date(`${today}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span><p><strong>{totalToday}<span> / {habits.length}</span></strong> habits complete</p><div className="progress"><i style={{ width: `${habits.length ? totalToday / habits.length * 100 : 0}%` }}/></div></div><div className="overview-note"><span className="sun">☼</span><div><h3>{habits.length && totalToday === habits.length ? 'A little effort, well spent.' : 'Make a little room for yourself.'}</h3><p>{habits.length && totalToday === habits.length ? 'All your habits are complete today. See you tomorrow.' : 'Your evening Telegram reminder is scheduled for 20:00, Germany time.'}</p></div></div></section>
      <section className="section-heading"><h2>Your habits <span>{habits.length.toString().padStart(2, '0')}</span></h2><div className="year-control"><button aria-label="Previous year" onClick={() => setYear(y => Math.max(1900, y - 1))}>‹</button><span>{year}</span><button aria-label="Next year" disabled={year >= Number(today.slice(0, 4))} onClick={() => setYear(y => y + 1)}>›</button></div></section>
      {loading ? <p role="status">Loading your journal…</p> : !habits.length ? <div className="empty"><span>✧</span><h2>Every habit starts with one day.</h2><p>Add something you’d like to make a little more time for.</p><button className="primary" onClick={() => setEditor({ name: '', color: colors[0] })}>＋ Create your first habit</button></div> : habits.map((habit, index) => {
        const summary = stats(habit.completed, year, today), done = habit.completed.includes(today);
        const days = yearDays(year), offset = (new Date(`${year}-01-01T12:00:00Z`).getUTCDay() + 6) % 7;
        return <article className="habit-card" key={habit.id} style={{ '--habit-color': habit.color }}><div className="habit-heading"><div className="habit-title"><span className="habit-number">{String(index + 1).padStart(2, '0')}</span><span className="color-dot"/><h3>{habit.name}</h3></div><div className="habit-actions"><button className={`check-today ${done ? 'done' : ''}`} disabled={busy} onClick={() => mark(habit.id, today, !done)}>{done ? '✓ Completed today' : '＋ Check in today'}</button><button className="icon-button" aria-label={`Edit ${habit.name}`} onClick={() => setEditor({ id: habit.id, name: habit.name, color: habit.color })}>✎</button><button className="icon-button" aria-label={`Delete ${habit.name}`} onClick={() => setRemove(habit)}>×</button></div></div>
        <div className="calendar-scroll"><div className="calendar"><div className="months">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}</div><div className="calendar-body"><div className="weekdays"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div><div className="heatmap">{Array.from({ length: offset }, (_, i) => <span className="spacer" key={`space-${i}`}/>)}{days.map(day => <button key={day} className={`day ${habit.completed.includes(day) ? 'complete' : ''} ${day === today ? 'today' : ''}`} title={`${pretty(day)} · ${habit.completed.includes(day) ? 'Complete' : 'Not complete'}`} aria-label={`${habit.name}, ${pretty(day)}, ${habit.completed.includes(day) ? 'complete' : 'not complete'}`} disabled={day > today} onClick={() => setSelection({ id: habit.id, day })}/>)}</div></div></div></div>
        <div className="card-bottom"><div className="stats">{[[summary.count,'Days completed'],[summary.longest,'Longest streak'],[summary.current,'Current streak'],[`${summary.average}%`,'Daily average']].map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="legend"><i/> Not yet <i className="filled"/> Done</div></div></article>;
      })}
      <p className="calendar-help">Click any past day to add or change a check-in. Yearly totals and longest streak follow the selected year; current streak follows today.</p>
    </main>}
    <footer><span>SMALL STEPS, EVERY DAY.</span><span>Made for progress. Room for being human.</span></footer>
    {editor && <Modal title={editor.id ? 'A little adjustment' : 'Start something good'} close={() => !busy && setEditor(null)}>{error && <p role="alert" className="modal-error">{error}</p>}<form onSubmit={saveHabit}><label>Habit name<input autoFocus maxLength={80} required placeholder="e.g. Read 10 pages" value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })}/></label><label>Habit color<div className="color-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(editor.color) ? editor.color : colors[0]} onChange={e => setEditor({ ...editor, color: e.target.value })}/><input aria-label="Hex color" value={editor.color} pattern="#[0-9a-fA-F]{6}" required onChange={e => setEditor({ ...editor, color: e.target.value })}/></div></label><div className="swatches">{colors.map(color => <button type="button" key={color} aria-label={`Choose ${color}`} style={{ background: color }} onClick={() => setEditor({ ...editor, color })}/>)}</div><button disabled={busy} className="primary">{busy ? 'Saving…' : 'Save habit'}</button></form></Modal>}
    {selectedHabit && <Modal title={selectedHabit.name} close={() => !busy && setSelection(null)}>{error && <p role="alert" className="modal-error">{error}</p>}<p className="date-label">{pretty(selection.day)}</p><p>{selectedHabit.completed.includes(selection.day) ? 'You checked in on this day. Need to change it?' : 'A small step worth remembering. Mark this day as complete?'}</p><button disabled={busy} className="primary" onClick={() => mark(selectedHabit.id, selection.day, !selectedHabit.completed.includes(selection.day))}>{busy ? 'Saving…' : selectedHabit.completed.includes(selection.day) ? 'Undo completion' : '✓ Confirm completion'}</button></Modal>}
    {remove && <Modal title="Delete this habit?" close={() => !busy && setRemove(null)}>{error && <p role="alert" className="modal-error">{error}</p>}<p>“{remove.name}” and all its check-ins will be permanently deleted.</p><button className="danger" disabled={busy} onClick={() => perform(async () => { if (!demo) check(await db.from('habits').delete().eq('id', remove.id)); setHabits(old => old.filter(h => h.id !== remove.id)); setRemove(null); })}>{busy ? 'Deleting…' : 'Delete habit'}</button></Modal>}
  </div>;
}
function Modal({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); close(); }}><div className="modal-head"><h2>{title}</h2><button aria-label="Close dialog" onClick={close}>×</button></div>{children}</dialog>;
}
createRoot(document.getElementById('root')).render(<App/>);
