import { ChevronUp, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

                <ChevronUp className="ml-auto h-5 w-5" />
            </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
            <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-5 w-5" />
                <p>Sign out</p>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
)
