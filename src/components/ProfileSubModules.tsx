import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Download,
  HeartHandshake,
  History,
  Send,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';

export function CalendarSubView() {
  const { state, addCalendarEvent } = useLifeOS();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [category, setCategory] = useState<'event' | 'work' | 'workout' | 'learning' | 'rest'>('event');

  const events = state.calendarEvents.filter((ev) => {
    if (viewMode === 'day') return ev.date === selectedDate;
    if (viewMode === 'month') return ev.date.slice(0, 7) === selectedDate.slice(0, 7);
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCalendarEvent({
      title: title.trim(),
      category,
      date: selectedDate,
      startTime,
      endTime,
    });
    setTitle('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Власний календар і нагадування
          </h3>
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(
            [
              ['day', 'День'],
              ['week', 'Тиждень'],
              ['month', 'Місяць'],
            ] as const
          ).map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                viewMode === id ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Події та автоматично синхронізовані завдання Kaizen
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">На обраний період подій немає.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((ev) => (
                <li key={ev.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{ev.title}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {ev.date} · {ev.startTime}–{ev.endTime} · {ev.category}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleAdd}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 h-fit"
        >
          <h4 className="text-sm font-semibold">Додати подію в календар</h4>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва події або дедлайну"
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="event">Подія</option>
            <option value="work">Робота</option>
            <option value="workout">Тренування</option>
            <option value="learning">Навчання</option>
            <option value="rest">Відпочинок</option>
          </select>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold">
            Додати в календар
          </button>
          <p className="text-[11px] text-slate-500 pt-1">
            Тихі години нагадувань: {state.settings.reminderSettings.quietHoursStart} – {state.settings.reminderSettings.quietHoursEnd}
          </p>
        </form>
      </div>
    </div>
  );
}

export function PhysicalSubView() {
  const { state, addWorkout, addBodyMetric } = useLifeOS();
  const [wTitle, setWTitle] = useState('');
  const [wType, setWType] = useState('Біг');
  const [wMins, setWMins] = useState('40');
  const [weight, setWeight] = useState('77.2');
  const [height, setHeight] = useState('180');

  const latestMetric = state.bodyMetrics[state.bodyMetrics.length - 1];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-bold">Фізичний розвиток і тренування</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold">Журнал тренувань ({state.workouts.length})</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!wTitle.trim()) return;
              addWorkout({
                title: wTitle.trim(),
                activityType: wType,
                durationMinutes: Number(wMins) || 30,
                date: new Date().toISOString().slice(0, 10),
                intensity: 'medium',
                notes: '',
              });
              setWTitle('');
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              type="text"
              required
              value={wTitle}
              onChange={(e) => setWTitle(e.target.value)}
              placeholder="Назва тренування"
              className="flex-1 min-w-[150px] px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={wType}
              onChange={(e) => setWType(e.target.value)}
              className="w-24 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              value={wMins}
              onChange={(e) => setWMins(e.target.value)}
              className="w-20 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <button type="submit" className="px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold">
              + Тренування (+35 XP)
            </button>
          </form>

          {state.workouts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Ще немає записаних тренувань. Додайте перше тренування вище.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.workouts.map((w) => (
                <li key={w.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{w.title}</p>
                    <p className="text-xs text-slate-500">
                      {w.date} · {w.activityType}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">
                    {w.durationMinutes} хв
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold">Фізичні показники</h4>
          {latestMetric ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Поточна вага</span>
                <p className="text-lg font-bold font-mono mt-0.5">{latestMetric.weightKg} кг</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Зріст</span>
                <p className="text-lg font-bold font-mono mt-0.5">{latestMetric.heightCm} см</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Зафіксуйте свій перший замір ваги та зросту нижче.
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addBodyMetric({
                date: new Date().toISOString().slice(0, 10),
                weightKg: Number(weight) || 75,
                heightCm: Number(height) || 175,
              });
            }}
            className="flex gap-2"
          >
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Вага (кг)"
              className="w-24 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Зріст (см)"
              className="w-24 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <button type="submit" className="flex-1 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold">
              Оновити замір
            </button>
          </form>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500">Історія ваги</p>
            {state.bodyMetrics.length === 0 ? (
              <p className="text-xs text-slate-400">Замірів ще не було.</p>
            ) : (
              state.bodyMetrics.slice(-4).map((m) => (
                <div key={m.id} className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">{m.date}</span>
                  <span>{m.weightKg} кг</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function LearningSubView() {
  const { state, completeLearningTopic, addCourse, sendAiMessage } = useLifeOS();
  const [tutorInput, setTutorInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const tutorMsgs = state.aiInteractions.filter((m) => m.module === 'tutor');

  const askTutor = async (q: string) => {
    if (!q.trim() || sending) return;
    setSending(true);
    try {
      await sendAiMessage('tutor', q.trim());
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-bold">Навчання та AI-репетитор</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-2">
            <input
              type="text"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              placeholder="Новий курс або програма навчання..."
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={() => {
                if (!newCourseTitle.trim()) return;
                addCourse(newCourseTitle.trim(), 'Самоосвіта', '2027-01-15', [
                  'Основи та ключові поняття',
                  'Практичний проєкт',
                ]);
                setNewCourseTitle('');
              }}
              className="px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
            >
              Додати курс
            </button>
          </div>

          {state.courses.map((course) => (
            <article
              key={course.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-semibold">{course.title}</h4>
                  <p className="text-xs text-slate-500">
                    {course.subject} · Дедлайн {course.deadline} · {course.hoursSpent} год
                  </p>
                </div>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {course.topics.map((topic) => (
                  <li key={topic.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {topic.completed && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                      <span className={topic.completed ? 'font-medium' : ''}>{topic.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-500">{topic.masteryPct}%</span>
                      <button
                        type="button"
                        onClick={() => askTutor(`Поясни простою мовою тему "${topic.title}" та дай тест із 3 питань`)}
                        className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Запитати AI
                      </button>
                      {!topic.completed && (
                        <button
                          type="button"
                          onClick={() => completeLearningTopic(course.id, topic.id, 92)}
                          className="px-2 py-1 rounded-md bg-teal-600 text-white font-semibold"
                        >
                          Здати тест (+40 XP)
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col min-h-[380px]">
          <h4 className="text-sm font-semibold mb-3">AI-репетитор (пояснення й перевірка знань)</h4>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-72">
            {tutorMsgs.length === 0 ? (
              <p className="text-xs text-slate-500">
                Натисніть «Запитати AI» біля будь-якої теми або поставте питання нижче.
              </p>
            ) : (
              tutorMsgs.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white ml-6'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 mr-6'
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askTutor(tutorInput);
              setTutorInput('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              placeholder="Поясни тему або створи тест..."
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function SocialSubView() {
  const { state, addSocialContact, addSocialEvent, sendAiMessage } = useLifeOS();
  const [cName, setCName] = useState('');
  const [cRel, setCRel] = useState('');
  const [cNote, setCNote] = useState('');
  const [coachInput, setCoachInput] = useState('');
  const [sending, setSending] = useState(false);

  const socialMsgs = state.aiInteractions.filter((m) => m.module === 'social');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HeartHandshake className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-bold">Соціальний розвиток та AI-тренер комунікації</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Особисті контакти та нотатки (захищено локально)</h4>
            <button
              type="button"
              onClick={() =>
                addSocialEvent({
                  title: 'Зустріч або телефонна розмова',
                  date: new Date().toISOString().slice(0, 10),
                  contactIds: [],
                  reflection: 'Якісний живий контакт',
                  confidenceRating: 4,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
            >
              + Записати зустріч (+30 XP)
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cName.trim()) return;
              addSocialContact({
                name: cName.trim(),
                relation: cRel.trim() || 'Знайомий',
                privateNote: cNote.trim(),
                lastContactDate: new Date().toISOString().slice(0, 10),
              });
              setCName('');
              setCRel('');
              setCNote('');
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <input
              type="text"
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Ім’я"
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={cRel}
              onChange={(e) => setCRel(e.target.value)}
              placeholder="Роль / зв’язок"
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={cNote}
                onChange={(e) => setCNote(e.target.value)}
                placeholder="Приватна нотатка"
                className="flex-1 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button type="submit" className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold">
                Додати
              </button>
            </div>
          </form>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.contacts.map((c) => (
              <li key={c.id} className="py-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-slate-500">{c.relation}</span>
                </div>
                {c.privateNote && <p className="text-slate-600 dark:text-slate-400">{c.privateNote}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col min-h-[340px]">
          <h4 className="text-sm font-semibold mb-2">AI-тренер комунікації</h4>
          <p className="text-xs text-slate-500 mb-3">
            Відпрацювання розмовних ситуацій, підготовка до переговорів і впевненість без гонитви за кількістю контактів.
          </p>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-60">
            {socialMsgs.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-teal-600 text-white ml-6' : 'bg-slate-100 dark:bg-slate-800 mr-6'
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!coachInput.trim() || sending) return;
              const txt = coachInput.trim();
              setCoachInput('');
              setSending(true);
              try {
                await sendAiMessage('social', txt);
              } finally {
                setSending(false);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              placeholder="Напр., Як впевнено почати переговори?"
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button type="submit" disabled={sending} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function DigitalHygieneSubView() {
  const { state, setDigitalHygieneMode, toggleDistractingApp, addDigitalApp } = useLifeOS();
  const [appName, setAppName] = useState('');
  const [appCat, setAppCat] = useState<'productive' | 'neutral' | 'distracting'>('distracting');
  const [appLimit, setAppLimit] = useState('30');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-bold">Цифрова гігієна</h3>
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('normal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
              state.digitalHygiene.mode === 'normal' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Звичайний
          </button>
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('focus', 45)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              state.digitalHygiene.mode === 'focus' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Focus Mode
          </button>
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('relax')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              state.digitalHygiene.mode === 'relax' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Relax Mode
          </button>
        </div>
      </div>

      {/* Honest platform limitation disclosure per §9.5 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        <strong>Обмеження платформи (§9.5):</strong> У вебверсії / PWA та без системних дозволів OS (Android{' '}
        <code>UsageStatsManager</code> або Apple <code>FamilyControls</code>) застосунок не блокує сторонні
        мобільні програми примусово — інтерфейс чесно відображає ваші ліміти, розклад та допомагає тримати фокус.
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Розклад концентрації: {state.digitalHygiene.scheduleStart} – {state.digitalHygiene.scheduleEnd}
          </span>
          <span>
            Активний режим:{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {state.digitalHygiene.mode === 'focus'
                ? 'Focus Mode'
                : state.digitalHygiene.mode === 'relax'
                  ? 'Relax Mode (дозволений відпочинок)'
                  : 'Звичайний'}
            </strong>
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!appName.trim()) return;
            addDigitalApp(appName.trim(), appCat, Number(appLimit) || 30);
            setAppName('');
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Назва застосунку (напр., Instagram або Notion)"
            className="flex-1 min-w-[170px] px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <select
            value={appCat}
            onChange={(e) => setAppCat(e.target.value as typeof appCat)}
            className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="distracting">Відволікає</option>
            <option value="neutral">Нейтральний</option>
            <option value="productive">Корисний</option>
          </select>
          <input
            type="number"
            min="5"
            value={appLimit}
            onChange={(e) => setAppLimit(e.target.value)}
            placeholder="Ліміт хв"
            className="w-24 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
          >
            Додати ліміт
          </button>
        </form>

        {state.digitalHygiene.apps.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            Список застосунків порожній. Додайте програми, які хочете контролювати під час Focus Mode.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.digitalHygiene.apps.map((app) => {
              const over = app.minutesToday > app.dailyLimitMinutes && state.digitalHygiene.mode !== 'relax';
              const inFocusBlock = state.digitalHygiene.focusSelectedApps.includes(app.appName);
              return (
                <li key={app.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {app.appName}{' '}
                      <span className="text-xs text-slate-500">
                        · {app.category === 'productive' ? 'Корисна' : app.category === 'distracting' ? 'Відволікає' : 'Нейтральна'}
                      </span>
                    </p>
                    <p className={`text-xs font-mono ${over ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                      {app.minutesToday} / {app.dailyLimitMinutes} хв сьогодні
                      {over ? ' · Перевищено ліміт' : ''}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={inFocusBlock}
                      onChange={() => toggleDistractingApp(app.appName)}
                    />
                    Обмежувати у Focus
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function HistorySubView() {
  const { state, updateSettings } = useLifeOS();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = state.lifeHistory.filter((h) => {
    const matchCat = catFilter === 'all' || h.category === catFilter;
    const matchSearch =
      !search.trim() ||
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.detail.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const exportHistoryJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-bold">Повна історія розвитку</h3>
        </div>
        <button
          type="button"
          onClick={exportHistoryJson}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          Експорт історії
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук в історії..."
            className="flex-1 min-w-[180px] px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">Усі категорії</option>
            <option value="goals">Цілі</option>
            <option value="tasks">Завдання</option>
            <option value="finances">Фінанси</option>
            <option value="time">Час</option>
            <option value="health">Здоров’я</option>
            <option value="learning">Навчання</option>
            <option value="social">Соціум</option>
            <option value="game">Ігровий світ</option>
            <option value="ai">AI-коуч</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
          <span>Зберігати в історії:</span>
          {(
            [
              ['goals', 'Цілі'],
              ['tasks', 'Завдання'],
              ['finances', 'Фінанси'],
              ['time', 'Час'],
              ['health', 'Здоров’я'],
              ['ai', 'AI'],
            ] as const
          ).map(([k, lbl]) => (
            <label key={k} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={state.settings.historyRetention[k]}
                onChange={(e) =>
                  updateSettings({
                    historyRetention: { ...state.settings.historyRetention, [k]: e.target.checked },
                  })
                }
              />
              {lbl}
            </label>
          ))}
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-slate-500 mt-0.5">{item.detail}</p>
              </div>
              <span className="font-mono text-slate-400 shrink-0">
                {item.timestamp.slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
