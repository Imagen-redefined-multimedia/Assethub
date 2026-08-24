import MaintenanceFilters from "@/app/components/maintenance/MaintenanceFilters";
import MaintenanceTable from "@/app/components/maintenance/MaintenanceTable";


export default function MaintenancePage() { 
  return ( 
    <div className="space-y-6 p-6"> 
      <div> 
        <h1 className="text-2xl font-semibold tracking-tight">
           Maintenance 
        </h1> 
        <p className="text-sm text-muted-foreground"> 
           maintenance reports and monitor asset maintenance activity. 
        </p> 
      </div> 
      <MaintenanceFilters /> 
      <MaintenanceTable /> 
    </div> 
  );
}
