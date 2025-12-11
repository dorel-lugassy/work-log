
import { BarChart2, Briefcase, Clock } from 'lucide-react'
import { UserButton } from "@clerk/clerk-react";

type Page = 'dashboard' | 'jobs' | 'reports'

interface NavigationProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'דשבורד', icon: <Clock /> }, // Changed icon from LayoutDashboard to Clock
        { id: 'jobs', label: 'עבודות', icon: <Briefcase /> },
        { id: 'reports', label: 'דוחות', icon: <BarChart2 /> }, // Changed icon from BarChart3 to BarChart2
    ]

    return (
        <nav className="nav-bottom">
            <ul>
                {navItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            className={currentPage === item.id ? 'active' : ''}
                            onClick={(e) => {
                                e.preventDefault()
                                onNavigate(item.id)
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </a>
                    </li>
                ))}
                <li>
                    <UserButton afterSignOutUrl="#" />
                </li>
            </ul>
        </nav>
    )
}
