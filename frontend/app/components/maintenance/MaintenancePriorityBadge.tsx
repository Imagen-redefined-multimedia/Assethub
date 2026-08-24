type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; 

interface Props { 
    priority: Priority | string; 

} 

export default function MaintenancePriorityBadge({ priority }: Props) {
    
    const styles: Record<string, string> = { 
        LOW: "bg-green-100 text-green-800", 
        MEDIUM: "bg-yellow-100 text-yellow-800", 
        HIGH: "bg-orange-100 text-orange-800", 
        CRITICAL: "bg-red-100 text-red-800", 
    }; 
        
        return ( 
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ styles[priority] ?? "bg-gray-100 text-gray-800" }`} > 
                    {priority} 
                </span> 
        ); 
    }