import React from 'react'

interface DotProps {
    status: boolean
}

const Dot: React.FC<DotProps> = ({ status }) => {
    const baseClasses = 'inline-block w-2 h-2 rounded-full mr-2'
    const colorClass = status ? 'bg-green-500' : 'bg-red-500'

    return (
        <span className={`${baseClasses} ${colorClass} animate-pulse`}></span>
    )
}

export default Dot
