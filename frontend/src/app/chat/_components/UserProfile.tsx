import { ChevronUp, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/_components/ui/avatar'
import { SidebarMenuButton } from '@/_components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/_components/ui/dropdown-menu'

interface UserProfileProps {
    user: {
        email?: string
        picture?: string
    } | null
    isLoadingUser: boolean
    logout: () => void
}

export const UserProfile = ({ user, isLoadingUser, logout }: UserProfileProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
                <Avatar className="h-8 w-8 mr-2 rounded-full">
                    <AvatarImage
                        src={user?.picture || 'https://avatar.iran.liara.run/public'}
                        alt={user?.email}
                        referrerPolicy="no-referrer"
                    />
                </Avatar>
                <p className="truncate">{user?.email}</p>

                <ChevronUp className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width]">
            <DropdownMenuItem onClick={logout} className="text-sm">
                <LogOut className="mr-2 h-4 w-4" />
                <p>Sign out</p>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
)
