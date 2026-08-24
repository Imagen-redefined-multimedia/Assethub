type MaintenanceStatus =  
    | "PENDING" 
    | "APPROVED" 
    | "REJECTED" 
    | "COMPLETED"; 

    interface Props { 
        status: MaintenanceStatus | string; 
    } 
    
    export default function MaintenanceStatusBadge({ status }: Props) {
        
        const styles: Record<string, string> = { 
            PENDING: "bg-yellow-100 text-yellow-800", 
            APPROVED: "bg-blue-100 text-blue-800", 
            REJECTED: "bg-red-100 text-red-800", 
            COMPLETED: "bg-green-100 text-green-800", 
        }; 
        
        return ( 
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${ styles[status] ?? "bg-gray-100 text-gray-800" }`} > 
                {status} 
            </span> 
        ); 
}