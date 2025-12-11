import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Timer } from '../components/Timer'
import { Play, Square, Clock } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import type { Doc } from '../../convex/_generated/dataModel'

type TimeEntryWithJob = Doc<"timeEntries"> & { job: Doc<"jobs"> | null }

export function Dashboard() {
    const jobs = useQuery(api.jobs.list)
    const activeTimers = useQuery(api.timeEntries.getActive) as TimeEntryWithJob[] | undefined
    const todayEntries = useQuery(api.timeEntries.getToday) as TimeEntryWithJob[] | undefined

    const clockIn = useMutation(api.timeEntries.clockIn)
    const clockOut = useMutation(api.timeEntries.clockOut)

    const handleClockIn = async (jobId: Id<"jobs">) => {
        try {
            await clockIn({ jobId })
        } catch (error) {
            console.error('Failed to clock in:', error)
            alert('שגיאה בסימון כניסה')
        }
    }

    const handleClockOut = async (entryId: Id<"timeEntries">) => {
        try {
            await clockOut({ id: entryId })
        } catch (error) {
            console.error('Failed to clock out:', error)
            alert('שגיאה בסימון יציאה')
        }
    }

    const isJobActive = (jobId: Id<"jobs">) => {
        return activeTimers?.some((timer: TimeEntryWithJob) => timer.jobId === jobId)
    }

    const getActiveTimer = (jobId: Id<"jobs">) => {
        return activeTimers?.find((timer: TimeEntryWithJob) => timer.jobId === jobId)
    }

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000)
        const minutes = Math.floor((ms % 3600000) / 60000)
        return `${hours}:${String(minutes).padStart(2, '0')}`
    }

    const getTodayTotalByJob = () => {
        if (!todayEntries) return {}

        const totals: Record<string, { duration: number; jobName: string; jobColor: string }> = {}

        for (const entry of todayEntries) {
            if (!entry.job) continue
            const jobId = entry.jobId.toString()

            if (!totals[jobId]) {
                totals[jobId] = { duration: 0, jobName: entry.job.name, jobColor: entry.job.color }
            }

            // For active entries, calculate current duration
            if (entry.endTime) {
                totals[jobId].duration += entry.duration || 0
            } else {
                totals[jobId].duration += Date.now() - entry.startTime
            }
        }

        return totals
    }

    const todayTotals = getTodayTotalByJob()
    const totalTodayMs = Object.values(todayTotals).reduce((sum: number, t) => sum + t.duration, 0)

    if (!jobs) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div>
            <header className="page-header">
                <h1 className="page-title">דשבורד</h1>
                <p className="page-subtitle">נהל את שעות העבודה שלך</p>
            </header>

            {/* Active Timers */}
            {activeTimers && activeTimers.length > 0 && (
                <section className="mb-lg">
                    <div className="section-header">
                        <h2 className="section-title">⏱️ טיימרים פעילים</h2>
                    </div>
                    <div className="jobs-grid">
                        {activeTimers.map((timer: TimeEntryWithJob) => (
                            <div key={timer._id} className="card active-timer-card">
                                <div className="flex gap-md" style={{ alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                    <div
                                        className="job-color-indicator"
                                        style={{ backgroundColor: timer.job?.color || '#3b82f6', height: '32px' }}
                                    />
                                    <h3 className="job-name">{timer.job?.name}</h3>
                                </div>
                                <Timer startTime={timer.startTime} />
                                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
                                    <button
                                        className="btn btn-clock-out"
                                        onClick={() => handleClockOut(timer._id)}
                                    >
                                        <Square size={18} />
                                        סיים משמרת
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Today's Summary */}
            <section className="mb-lg">
                <div className="section-header">
                    <h2 className="section-title">📊 סיכום היום</h2>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{formatDuration(totalTodayMs)}</div>
                        <div className="stat-label">סה"כ שעות היום</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{activeTimers?.length || 0}</div>
                        <div className="stat-label">טיימרים פעילים</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{todayEntries?.filter((e: TimeEntryWithJob) => e.endTime).length || 0}</div>
                        <div className="stat-label">משמרות הושלמו</div>
                    </div>
                </div>

                {Object.keys(todayTotals).length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        {Object.entries(todayTotals).map(([jobId, data]) => (
                            <div key={jobId} className="flex-between" style={{
                                padding: 'var(--space-md)',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-sm)'
                            }}>
                                <div className="flex gap-md" style={{ alignItems: 'center' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: data.jobColor
                                    }} />
                                    <span>{data.jobName}</span>
                                </div>
                                <span className="font-bold">{formatDuration(data.duration)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Clock In */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">🚀 כניסה מהירה</h2>
                </div>

                {jobs.length === 0 ? (
                    <div className="empty-state card">
                        <Clock size={64} />
                        <h3>אין עבודות</h3>
                        <p>הוסף עבודות בעמוד "עבודות" כדי להתחיל למעקב</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.map((job: Doc<"jobs">) => {
                            const active = isJobActive(job._id);
                            const activeTimer = getActiveTimer(job._id);

                            return (
                                <div
                                    key={job._id}
                                    className={`job-card ${active ? 'active-timer-card' : ''}`}
                                    style={active ? { borderColor: job.color } : {}}
                                >
                                    <div
                                        className="job-color-indicator"
                                        style={{ backgroundColor: job.color }}
                                    />
                                    <div className="job-info">
                                        <div className="flex-between">
                                            <h3 className="job-name">{job.name}</h3>
                                            {active && (
                                                <div className="badge badge-success pulse-animation">
                                                    פעיל
                                                </div>
                                            )}
                                        </div>
                                        <p className="job-rate">₪{job.hourlyRate}/שעה</p>

                                        {active && activeTimer && (
                                            <div className="active-timer-display-container">
                                                <Timer startTime={activeTimer.startTime} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="job-actions">
                                        {active ? (
                                            <button
                                                className="btn btn-clock-out btn-full"
                                                onClick={() => activeTimer && handleClockOut(activeTimer._id)}
                                            >
                                                <Square size={18} />
                                                יציאה
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-clock-in btn-icon-only"
                                                onClick={() => handleClockIn(job._id)}
                                                title="כניסה"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
