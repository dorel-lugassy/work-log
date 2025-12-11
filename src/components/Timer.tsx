import { useState, useEffect } from 'react'

interface TimerProps {
    startTime: number
    isActive?: boolean
}

export function Timer({ startTime, isActive = true }: TimerProps) {
    const [elapsed, setElapsed] = useState(Date.now() - startTime)

    useEffect(() => {
        if (!isActive) return

        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime)
        }, 1000)

        return () => clearInterval(interval)
    }, [startTime, isActive])

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    return (
        <div className={`timer-display ${isActive ? 'active' : ''}`}>
            {formatTime(elapsed)}
        </div>
    )
}
