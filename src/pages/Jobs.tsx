import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Modal } from '../components/Modal'
import { Plus, Edit2, Trash2, RotateCcw } from 'lucide-react'
import type { Id, Doc } from '../../convex/_generated/dataModel'

const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
]

interface JobFormData {
    name: string
    color: string
    hourlyRate: number
}

export function Jobs() {
    const jobs = useQuery(api.jobs.listAll)
    const createJob = useMutation(api.jobs.create)
    const updateJob = useMutation(api.jobs.update)
    const removeJob = useMutation(api.jobs.remove)
    const restoreJob = useMutation(api.jobs.restore)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState<{ id: Id<"jobs">; data: JobFormData } | null>(null)
    const [formData, setFormData] = useState<JobFormData>({
        name: '',
        color: COLORS[0],
        hourlyRate: 50,
    })

    const activeJobs = jobs?.filter((j: Doc<"jobs">) => j.isActive) || []
    const archivedJobs = jobs?.filter((j: Doc<"jobs">) => !j.isActive) || []

    const openCreateModal = () => {
        setEditingJob(null)
        setFormData({ name: '', color: COLORS[0], hourlyRate: 50 })
        setIsModalOpen(true)
    }

    const openEditModal = (job: Doc<"jobs">) => {
        setEditingJob({
            id: job._id,
            data: { name: job.name, color: job.color, hourlyRate: job.hourlyRate }
        })
        setFormData({ name: job.name, color: job.color, hourlyRate: job.hourlyRate })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            alert('נא להזין שם עבודה')
            return
        }

        try {
            if (editingJob) {
                await updateJob({
                    id: editingJob.id,
                    name: formData.name,
                    color: formData.color,
                    hourlyRate: formData.hourlyRate,
                })
            } else {
                await createJob({
                    name: formData.name,
                    color: formData.color,
                    hourlyRate: formData.hourlyRate,
                })
            }
            setIsModalOpen(false)
        } catch (error) {
            console.error('Failed to save job:', error)
            alert('שגיאה בשמירת העבודה')
        }
    }

    const handleRemove = async (id: Id<"jobs">) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק עבודה זו?')) return

        try {
            await removeJob({ id })
        } catch (error) {
            console.error('Failed to remove job:', error)
            alert('שגיאה במחיקת העבודה')
        }
    }

    const handleRestore = async (id: Id<"jobs">) => {
        try {
            await restoreJob({ id })
        } catch (error) {
            console.error('Failed to restore job:', error)
            alert('שגיאה בשחזור העבודה')
        }
    }

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
                <h1 className="page-title">עבודות</h1>
                <p className="page-subtitle">נהל את רשימת העבודות שלך</p>
            </header>

            <section className="mb-lg">
                <div className="section-header">
                    <h2 className="section-title">עבודות פעילות ({activeJobs.length})</h2>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        הוסף עבודה
                    </button>
                </div>

                {activeJobs.length === 0 ? (
                    <div className="empty-state card">
                        <Plus size={64} />
                        <h3>אין עבודות</h3>
                        <p>לחץ על "הוסף עבודה" כדי להתחיל</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {activeJobs.map((job: Doc<"jobs">) => (
                            <div key={job._id} className="job-card">
                                <div
                                    className="job-color-indicator"
                                    style={{ backgroundColor: job.color }}
                                />
                                <div className="job-info">
                                    <h3 className="job-name">{job.name}</h3>
                                    <p className="job-rate">₪{job.hourlyRate}/שעה</p>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => openEditModal(job)}
                                        title="ערוך"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => handleRemove(job._id)}
                                        title="מחק"
                                        style={{ color: 'var(--color-danger)' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {archivedJobs.length > 0 && (
                <section>
                    <div className="section-header">
                        <h2 className="section-title text-muted">ארכיון ({archivedJobs.length})</h2>
                    </div>
                    <div className="jobs-grid">
                        {archivedJobs.map((job: Doc<"jobs">) => (
                            <div key={job._id} className="job-card" style={{ opacity: 0.6 }}>
                                <div
                                    className="job-color-indicator"
                                    style={{ backgroundColor: job.color }}
                                />
                                <div className="job-info">
                                    <h3 className="job-name">{job.name}</h3>
                                    <p className="job-rate">₪{job.hourlyRate}/שעה</p>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleRestore(job._id)}
                                >
                                    <RotateCcw size={16} />
                                    שחזר
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingJob ? 'ערוך עבודה' : 'הוסף עבודה חדשה'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">שם העבודה</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="לדוגמה: חברת הייטק"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">צבע</label>
                        <div className="color-picker">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">שכר לשעה (₪)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.hourlyRate}
                            onChange={e => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                            min="0"
                            step="0.5"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                            {editingJob ? 'שמור שינויים' : 'הוסף עבודה'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
