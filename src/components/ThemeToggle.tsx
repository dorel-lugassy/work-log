import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
    theme: 'light' | 'dark'
    onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    return (
        <div className="theme-toggle">
            <button
                className="btn btn-icon btn-secondary"
                onClick={onToggle}
                title={theme === 'light' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
    )
}
