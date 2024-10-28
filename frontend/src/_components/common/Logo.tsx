import { Robot, User } from '@/components/svg'
import { memo } from 'react'

interface LogoProps {
    hasText?: boolean
    type: 'user' | 'robot'
}

export const Logo = memo(({ hasText = false, type }: LogoProps) => {
    let SvgContent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
    let text = ''

    switch (type) {
        case 'user':
            SvgContent = User
            text = 'User'
            break
        case 'robot':
            SvgContent = Robot
            text = 'Robot'
            break
        default:
            SvgContent = Robot
            text = 'Robot'
    }

    return (
        <div className="h-8 w-8 flex items-center justify-center">
            <SvgContent className="w-full h-full" />
            {hasText && <div className="text-gray-700 text-sm font-medium ml-2">{text}</div>}
        </div>
    )
})

Logo.displayName = 'Logo'
