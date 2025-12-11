import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Download, Calendar, Filter, Edit2, Trash2, Save } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Modal } from '../components/Modal'
import type { Id } from '../../convex/_generated/dataModel'

interface ExportEntry {
    date: string
    jobName: string
    startTime: string
    endTime: string
    durationFormatted: string
    durationHours: string
    hourlyRate: number
    salary: string
    notes: string
}

interface DailySummary {
    jobId: string
    jobName: string
    jobColor: string
    hourlyRate: number
    totalDuration: number
    entries: Array<{
        _id: string
        startTime: number
        endTime?: number
        duration?: number
    }>
}

interface MonthlySummary {
    jobId: string
    jobName: string
    jobColor: string
    hourlyRate: number
    totalDuration: number
    totalSalary: number
    entriesCount: number
}

export function Reports() {
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() }
    })

    const updateEntry = useMutation(api.timeEntries.updateEntry)
    const deleteEntry = useMutation(api.timeEntries.deleteEntry)

    const [editingEntry, setEditingEntry] = useState<{
        id: Id<"timeEntries">;
        startTime: string;
        endTime: string;
        notes: string;
    } | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const dailySummary = useQuery(
        api.reports.getDailySummary,
        viewMode === 'daily' ? { date: selectedDate.getTime() } : 'skip'
    ) as DailySummary[] | undefined

    const monthlySummary = useQuery(
        api.reports.getMonthlySummary,
        viewMode === 'monthly' ? { year: selectedMonth.year, month: selectedMonth.month } : 'skip'
    ) as MonthlySummary[] | undefined

    // For export
    const startOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1).getTime()
    const endOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59, 999).getTime()

    const exportData = useQuery(
        api.reports.getEntriesForExport,
        viewMode === 'monthly' ? { startDate: startOfMonth, endDate: endOfMonth } : 'skip'
    ) as ExportEntry[] | undefined

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000)
        const minutes = Math.floor((ms % 3600000) / 60000)
        return `${hours}:${String(minutes).padStart(2, '0')}`
    }

    const formatCurrency = (amount: number) => {
        return `₪${amount.toFixed(2)}`
    }

    const handleExport = () => {
        if (!exportData || exportData.length === 0) {
            alert('אין נתונים לייצוא')
            return
        }

        // Prepare data for Excel
        const wsData: (string | number)[][] = [
            ['תאריך', 'עבודה', 'שעת כניסה', 'שעת יציאה', 'סה"כ שעות', 'שכר לשעה', 'שכר', 'הערות'],
            ...exportData.map((entry: ExportEntry) => [
                entry.date,
                entry.jobName,
                entry.startTime,
                entry.endTime,
                entry.durationFormatted,
                `₪${entry.hourlyRate}`,
                `₪${entry.salary}`,
                entry.notes,
            ])
        ]

        // Add summary row
        const totalHours = exportData.reduce((sum: number, e: ExportEntry) => sum + parseFloat(e.durationHours), 0)
        const totalSalary = exportData.reduce((sum: number, e: ExportEntry) => sum + parseFloat(e.salary), 0)
        wsData.push([])
        wsData.push(['', '', '', '', formatDuration(totalHours * 3600000), '', formatCurrency(totalSalary), 'סה"כ'])

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'שעות עבודה')

        // Set RTL and column widths
        ws['!cols'] = [
            { wch: 12 }, // Date
            { wch: 15 }, // Job
            { wch: 10 }, // Start
            { wch: 10 }, // End
            { wch: 10 }, // Duration
            { wch: 10 }, // Rate
            { wch: 10 }, // Salary
            { wch: 20 }, // Notes
        ]

        const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
        const fileName = `שעות_עבודה_${monthNames[selectedMonth.month]}_${selectedMonth.year}.xlsx`

        XLSX.writeFile(wb, fileName)
    }

    const handleDelete = async (id: Id<"timeEntries">) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משמרת זו?')) return

        try {
            await deleteEntry({ id })
        } catch (error) {
            console.error('Failed to delete entry:', error)
            alert('שגיאה במחיקת המשמרת')
        }
    }

    const handleEditClick = (entry: any) => {
        // Convert timestamps to local datetime string for inputs
        const toLocalISO = (ms: number) => {
            const date = new Date(ms)
            const offset = date.getTimezoneOffset() * 60000
            return new Date(date.getTime() - offset).toISOString().slice(0, 16)
        }

        setEditingEntry({
            id: entry._id,
            startTime: toLocalISO(entry.startTime),
            endTime: entry.endTime ? toLocalISO(entry.endTime) : '',
            notes: entry.notes || ''
        })
        setIsEditModalOpen(true)
    }

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingEntry) return

        try {
            await updateEntry({
                id: editingEntry.id,
                startTime: new Date(editingEntry.startTime).getTime(),
                endTime: new Date(editingEntry.endTime).getTime(),
                notes: editingEntry.notes
            })
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Failed to update entry:', error)
            alert('שגיאה בעדכון המשמרת')
        }
    }

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

    const summary = viewMode === 'daily' ? dailySummary : monthlySummary
    const totalDuration = summary?.reduce((sum: number, s: DailySummary | MonthlySummary) => sum + s.totalDuration, 0) || 0
    const totalSalaryAmount = viewMode === 'monthly'
        ? (monthlySummary?.reduce((sum: number, s: MonthlySummary) => sum + s.totalSalary, 0) || 0)
        : (dailySummary?.reduce((sum: number, s: DailySummary) => sum + (s.totalDuration / 3600000) * s.hourlyRate, 0) || 0)

    return (
        <div>
            <header className="page-header">
                <h1 className="page-title">דוחות</h1>
                <p className="page-subtitle">צפה בסיכומי שעות ושכר</p>
            </header>

            {/* View Mode Toggle */}
            <div className="flex gap-sm mb-lg">
                <button
                    className={`btn ${viewMode === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('daily')}
                >
                    <Calendar size={18} />
                    יומי
                </button>
                <button
                    className={`btn ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('monthly')}
                >
                    <Filter size={18} />
                    חודשי
                </button>
            </div>

            {/* Date Selection */}
            <div className="date-filter">
                {viewMode === 'daily' ? (
                    <div className="form-group">
                        <label className="form-label">בחר תאריך</label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={e => setSelectedDate(new Date(e.target.value))}
                        />
                    </div>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label">חודש</label>
                            <select
                                className="form-input"
                                value={selectedMonth.month}
                                onChange={e => setSelectedMonth(prev => ({ ...prev, month: Number(e.target.value) }))}
                            >
                                {monthNames.map((name, index) => (
                                    <option key={index} value={index}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">שנה</label>
                            <select
                                className="form-input"
                                value={selectedMonth.year}
                                onChange={e => setSelectedMonth(prev => ({ ...prev, year: Number(e.target.value) }))}
                            >
                                {[2023, 2024, 2025, 2026].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">&nbsp;</label>
                            <button className="btn btn-success" onClick={handleExport}>
                                <Download size={18} />
                                ייצא לאקסל
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Total Summary */}
            <div className="stats-grid mb-lg">
                <div className="stat-card">
                    <div className="stat-value">{formatDuration(totalDuration)}</div>
                    <div className="stat-label">סה"כ שעות</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{formatCurrency(totalSalaryAmount)}</div>
                    <div className="stat-label">סה"כ שכר</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{summary?.length || 0}</div>
                    <div className="stat-label">עבודות</div>
                </div>
            </div>

            {/* Per-Job Summaries */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">פירוט לפי עבודה</h2>
                </div>

                {!summary || summary.length === 0 ? (
                    <div className="empty-state card">
                        <Calendar size={64} />
                        <h3>אין נתונים</h3>
                        <p>לא נמצאו רשומות עבודה לתקופה הנבחרת</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {summary.map((job: DailySummary | MonthlySummary) => (
                            <div key={job.jobId} className="summary-card">
                                <div className="summary-header">
                                    <div className="summary-color" style={{ backgroundColor: job.jobColor }} />
                                    <span className="summary-job-name">{job.jobName}</span>
                                </div>
                                <div className="summary-stats">
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{formatDuration(job.totalDuration)}</div>
                                        <div className="summary-stat-label">שעות</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">
                                            {formatCurrency((job.totalDuration / 3600000) * job.hourlyRate)}
                                        </div>
                                        <div className="summary-stat-label">שכר</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">₪{job.hourlyRate}</div>
                                        <div className="summary-stat-label">לשעה</div>
                                    </div>
                                    {viewMode === 'monthly' && 'entriesCount' in job && (
                                        <div className="summary-stat">
                                            <div className="summary-stat-value">{(job as MonthlySummary).entriesCount}</div>
                                            <div className="summary-stat-label">משמרות</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Detailed Entries Table for Daily View */}
            {viewMode === 'daily' && dailySummary && dailySummary.length > 0 && (
                <section className="mt-lg">
                    <div className="section-header">
                        <h2 className="section-title">פירוט משמרות</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>עבודה</th>
                                    <th>שעת כניסה</th>
                                    <th>שעת יציאה</th>
                                    <th>משך</th>
                                    <th>שכר</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySummary.flatMap((job: DailySummary) =>
                                    job.entries.map((entry) => {
                                        const start = new Date(entry.startTime)
                                        const end = entry.endTime ? new Date(entry.endTime) : null
                                        const duration = entry.duration || 0
                                        const salary = (duration / 3600000) * job.hourlyRate

                                        return (
                                            <tr key={entry._id}>
                                                <td>
                                                    <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: job.jobColor
                                                        }} />
                                                        {job.jobName}
                                                    </div>
                                                </td>
                                                <td>{start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{end ? end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                <td>{formatDuration(duration)}</td>
                                                <td>{formatCurrency(salary)}</td>
                                                <td>
                                                    <div className="flex gap-sm justify-end">
                                                        <button
                                                            className="btn btn-icon btn-ghost"
                                                            onClick={() => handleEditClick(entry)}
                                                            title="ערוך"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-icon btn-ghost"
                                                            style={{ color: 'var(--color-danger)' }}
                                                            onClick={() => handleDelete(entry._id as Id<"timeEntries">)}
                                                            title="מחק"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="ערוך משמרת"
            >
                {editingEntry && (
                    <form onSubmit={handleSaveEntry}>
                        <div className="form-group">
                            <label className="form-label">זמן התחלה</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={editingEntry.startTime}
                                onChange={e => setEditingEntry(prev => prev ? ({ ...prev, startTime: e.target.value }) : null)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">זמן סיום</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={editingEntry.endTime}
                                onChange={e => setEditingEntry(prev => prev ? ({ ...prev, endTime: e.target.value }) : null)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">הערות</label>
                            <textarea
                                className="form-input"
                                value={editingEntry.notes}
                                onChange={e => setEditingEntry(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                                rows={3}
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                                <Save size={18} />
                                שמור שינויים
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-lg"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}
