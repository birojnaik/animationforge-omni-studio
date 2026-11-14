export type StudioTab = 'overview' | 'stage' | 'farm' | 'archives' | 'verification';

export interface ToolProbe {
  available: boolean;
  version?: string;
  path?: string;
  commit_sha?: string;
  branch?: string;
}

export interface StudioEnvironment {
  cpu_logical_cores: number;
  memory_total_mb: number | null;
  disk_free_gb: number;
  tools: {
    python3: ToolProbe;
    ffmpeg: ToolProbe;
    git: ToolProbe;
    blender: ToolProbe;
    gh: ToolProbe;
  };
  flamenco_config: {
    logical_worker_slots: number;
    groups: number;
    workers_per_group: number;
    autoscaling: string;
    failed_frame_reassignment: string;
    default_resolution: string;
    default_fps: number;
    master_format: string;
    target_mean_frame_seconds: number;
    target_sustained_fps: number;
    physical_host_note: string;
  };
}

export interface DagNode {
  op_id: string;
  stage: string;
  agent_id: string;
  agent_name: string;
  depends_on: string[];
  execution_mode: string;
  estimated_tokens: number;
  naive_per_op_tokens: number;
  status: string;
}

export interface ProductionProject {
  project_id: string;
  title: string;
  premise: string;
  style: string;
  compiled_at: string;
  specs: {
    duration_seconds: number;
    fps: number;
    total_frames: number;
    preview_resolution: string;
    master_resolution: string;
    master_format: string;
  };
  artistic_dna: {
    visual_motifs: string[];
    emotional_beats: { beat: string; frames: string; note: string }[];
    protected_imperfections: string[];
  };
  dag_nodes: DagNode[];
  token_economy: {
    compiled_tokens_used: number;
    naive_llm_baseline_tokens: number;
    measured_reduction_percent: number;
    target_reduction_percent: number;
    note: string;
  };
}

export interface CoreAgent {
  id: string;
  name: string;
  layer: string;
  focus: string;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  scope: string;
}

export interface ProductionRole {
  id: string;
  name: string;
  discipline: string;
  supervisor_agent: string;
  tier: string;
}

export interface QualityGate {
  id: string;
  category: string;
  title: string;
  criteria: string;
}

export interface WorkerSlot {
  id: string;
  slot: number;
  group: string;
  status: string;
  max_concurrent_jobs: number;
  autoscaling: string;
  target_resolution: string;
  target_fps: number;
  master_format: string;
}

export interface CheckpointRecord {
  checkpoint_id: string;
  project_id: string;
  milestone: string;
  completed_ops: number;
  total_ops: number;
  created_at: string;
}

export interface RepairLog {
  id: number;
  project_id: string;
  fault_type: string;
  diagnosis: string;
  repair_action: string;
  outcome: string;
  created_at: string;
}

export interface ArchiveFileItem {
  name: string;
  size_bytes: number;
  sha256: string;
}

export interface ReportFileItem {
  name: string;
  size_bytes: number;
}

export interface StudioState {
  version: string;
  ai_available: boolean;
  environment: StudioEnvironment;
  project: ProductionProject;
  layers: ArchitectureLayer[];
  stages: string[];
  agents: CoreAgent[];
  roles: ProductionRole[];
  quality_gates: QualityGate[];
  workers: WorkerSlot[];
  checkpoints: CheckpointRecord[];
  repair_logs: RepairLog[];
  archives: ArchiveFileItem[];
  reports: ReportFileItem[];
  demo_media: {
    mp4_ready: boolean;
    mp4_size_bytes: number;
    wav_ready: boolean;
    bpy_ready: boolean;
  };
}
