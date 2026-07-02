export type HealthStatus = 0 | 1 | 2; // 0=excellent 1=needsAttention 2=critical

export interface ComponentHealth {
  type: "inverter" | "battery" | "solar";
  health_score: number;
  status: HealthStatus;
  age: string;
  specs: string[];
  details: Record<string, string>;
  efficiency: number;
  warranty: string;
  alert: string | null;
  catalog_specs: Record<string, unknown>;
}

export interface InstallationInfo {
  system_size: string;
  installed_date: string;
  installer_name: string;
}

export interface MaintenanceTip {
  icon: string;
  description: string;
  frequency: string;
}

export interface SystemHealthData {
  overall_score: number;
  overall_status: HealthStatus;
  inverter: ComponentHealth;
  battery: ComponentHealth;
  solar_panel: ComponentHealth;
  installation: InstallationInfo;
  maintenance_tips: MaintenanceTip[];
  last_updated: string;
}

export function statusLabel(status: HealthStatus): string {
  if (status === 0) return "Excellent";
  if (status === 1) return "Needs Attention";
  return "Replace Soon";
}
