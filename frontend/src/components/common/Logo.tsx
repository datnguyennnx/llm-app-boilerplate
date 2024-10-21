import { Robot, User } from '@/components/svg'

interface LogoProps {
    hasText?: boolean
    type: 'user' | 'robot'
}

export const Logo = ({ hasText = false, type }: LogoProps) => {
    let SvgContent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
    let text = ''

    switch (type) {
        case 'user':
            SvgContent = User
            text = 'avatar'
            break
        case 'robot':
            SvgContent = Robot
            text = 'robot'
            break
        default:
            SvgContent = Robot
            text = 'robot'
    }

    return (
        <div className="h-8 w-8 flex items-center justify-center">
            <SvgContent />
            {hasText && (
                <div className="text-white text-2xl tracking-wide ml-3 font-semibold">{text}</div>
            )}
        </div>
    )
}
