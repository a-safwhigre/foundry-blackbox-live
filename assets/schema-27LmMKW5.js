const T=`
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  unit_subtitle TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  plant_address TEXT NOT NULL DEFAULT '',
  iso_cert_note TEXT NOT NULL DEFAULT 'ISO 9001:2015 Quality Management System',
  active_shift TEXT NOT NULL DEFAULT 'Shift A (06:00-14:00)',
  default_power_rate_rs_kwh NUMERIC(10,2) NOT NULL DEFAULT 8.80,
  melting_energy_norm_kwh_mt INTEGER NOT NULL DEFAULT 650,
  spc_ucl_kwh_mt INTEGER NOT NULL DEFAULT 690,
  spc_lcl_kwh_mt INTEGER NOT NULL DEFAULT 610,
  chief_metallurgist TEXT NOT NULL DEFAULT '',
  qa_head TEXT NOT NULL DEFAULT '',
  is_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  qualification TEXT NOT NULL DEFAULT '',
  wps_or_cert TEXT NOT NULL DEFAULT '',
  competence_status TEXT NOT NULL DEFAULT 'Qualified',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

CREATE TABLE IF NOT EXISTS furnaces (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  furnace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity_kg INTEGER NOT NULL DEFAULT 1000,
  lining_heats_used INTEGER NOT NULL DEFAULT 0,
  lining_max_heats INTEGER NOT NULL DEFAULT 55,
  last_relined_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  UNIQUE(org_id, furnace_id)
);

CREATE TABLE IF NOT EXISTS metal_grades (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grade_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  category TEXT NOT NULL,
  colour_code TEXT NOT NULL,
  colour_hex TEXT NOT NULL,
  tap_min_c INTEGER NOT NULL,
  tap_max_c INTEGER NOT NULL,
  pour_min_c INTEGER NOT NULL,
  pour_max_c INTEGER NOT NULL,
  chemistry_json JSONB NOT NULL,
  mechanical_json JSONB NOT NULL,
  UNIQUE(org_id, grade_code)
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_no TEXT NOT NULL,
  revision_no INTEGER NOT NULL DEFAULT 1,
  customer TEXT NOT NULL,
  customer_gstin TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  drawing_no TEXT NOT NULL,
  grade_code TEXT NOT NULL,
  pattern_id TEXT NOT NULL DEFAULT '',
  net_weight_kg NUMERIC(12,2) NOT NULL,
  gross_weight_kg NUMERIC(12,2) NOT NULL,
  yield_pct NUMERIC(6,2) NOT NULL,
  order_qty INTEGER NOT NULL,
  liquid_metal_rs_kg NUMERIC(12,2) NOT NULL,
  conversion_rs_kg NUMERIC(12,2) NOT NULL,
  ex_works_rs_kg NUMERIC(12,2) NOT NULL,
  quoted_rate_rs_kg NUMERIC(12,2) NOT NULL,
  quote_piece_value_rs NUMERIC(14,2) NOT NULL,
  total_order_value_rs NUMERIC(16,2) NOT NULL,
  delivery_weeks INTEGER NOT NULL DEFAULT 4,
  ndt_required_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Draft',
  converted_wo_no TEXT,
  prepared_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, quote_no)
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pattern_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  drawing_no TEXT NOT NULL,
  customer TEXT NOT NULL,
  grade_code TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  ownership TEXT NOT NULL,
  cavities_per_mould INTEGER NOT NULL DEFAULT 1,
  core_box_count INTEGER NOT NULL DEFAULT 0,
  loose_pieces INTEGER NOT NULL DEFAULT 0,
  box_size_mm TEXT NOT NULL,
  rack_location TEXT NOT NULL,
  life_impressions_max INTEGER NOT NULL DEFAULT 500,
  impressions_used INTEGER NOT NULL DEFAULT 0,
  riser_type TEXT NOT NULL,
  pouring_ladle TEXT NOT NULL,
  knockout_hours NUMERIC(6,1) NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'Available',
  last_inspected TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, pattern_id)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_order_no TEXT NOT NULL,
  po_no TEXT NOT NULL,
  po_date TEXT NOT NULL,
  customer TEXT NOT NULL,
  item_name TEXT NOT NULL,
  drawing_no TEXT NOT NULL,
  rev_no TEXT NOT NULL DEFAULT '00',
  grade_code TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  order_qty INTEGER NOT NULL,
  moulded_qty INTEGER NOT NULL DEFAULT 0,
  poured_qty INTEGER NOT NULL DEFAULT 0,
  accepted_qty INTEGER NOT NULL DEFAULT 0,
  rejected_qty INTEGER NOT NULL DEFAULT 0,
  dispatched_qty INTEGER NOT NULL DEFAULT 0,
  net_weight_kg NUMERIC(12,2) NOT NULL,
  gross_weight_kg NUMERIC(12,2) NOT NULL,
  yield_pct NUMERIC(6,2) NOT NULL,
  rate_per_kg_rs NUMERIC(12,2) NOT NULL,
  delivery_date TEXT NOT NULL,
  qap_no TEXT NOT NULL DEFAULT '',
  ndt_required_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Pattern Prep',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, work_order_no)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
  reorder_level_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  rate_rs NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_vendor TEXT NOT NULL DEFAULT '',
  vendor_rating TEXT NOT NULL DEFAULT 'Grade A',
  bin_location TEXT NOT NULL DEFAULT 'MAIN-BAY',
  last_mrn_no TEXT NOT NULL DEFAULT 'OPENING',
  spec_check_status TEXT NOT NULL DEFAULT 'Accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT NOT NULL DEFAULT '',
  order_date TEXT NOT NULL,
  expected_date TEXT NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT '30 Days Net',
  lines_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount_rs NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Open',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, po_number)
);

CREATE TABLE IF NOT EXISTS material_receipts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mrn_no TEXT NOT NULL,
  po_number TEXT NOT NULL DEFAULT 'DIRECT',
  vendor_name TEXT NOT NULL,
  challan_no TEXT NOT NULL,
  vehicle_no TEXT NOT NULL DEFAULT '',
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  received_qty NUMERIC(14,2) NOT NULL,
  accepted_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  rejected_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit_rate_rs NUMERIC(12,2) NOT NULL,
  lab_status TEXT NOT NULL DEFAULT 'Pending Lab Clearance',
  test_certificate_ref TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT '',
  received_by TEXT NOT NULL,
  cleared_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, mrn_no)
);

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  txn_type TEXT NOT NULL,
  qty_delta NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  unit_rate_rs NUMERIC(12,2) NOT NULL DEFAULT 0,
  reference_type TEXT NOT NULL,
  reference_no TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  actor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_ledger_org ON inventory_ledger(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS heats (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  heat_no TEXT NOT NULL,
  heat_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  furnace_id TEXT NOT NULL,
  lining_heat_count INTEGER NOT NULL DEFAULT 1,
  grade_code TEXT NOT NULL,
  work_order_nos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  charge_time TEXT NOT NULL,
  tap_time TEXT NOT NULL,
  melt_minutes INTEGER NOT NULL DEFAULT 55,
  kwh_initial NUMERIC(14,1) NOT NULL DEFAULT 0,
  kwh_final NUMERIC(14,1) NOT NULL DEFAULT 0,
  net_kwh NUMERIC(12,1) NOT NULL DEFAULT 0,
  total_charge_kg NUMERIC(12,2) NOT NULL,
  kwh_per_ton INTEGER NOT NULL,
  tapping_temp_c INTEGER NOT NULL,
  pouring_temp_c INTEGER NOT NULL,
  return_metal_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  skull_loss_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  melter TEXT NOT NULL,
  release_approved_by TEXT,
  charge_mix_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  mechanical_actual_json JSONB,
  status TEXT NOT NULL DEFAULT 'Awaiting Bath Lab',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, heat_no)
);

CREATE TABLE IF NOT EXISTS spectro_samples (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sample_id TEXT NOT NULL,
  heat_no TEXT NOT NULL,
  stage TEXT NOT NULL,
  sampled_at TEXT NOT NULL,
  chemist TEXT NOT NULL,
  elements_json JSONB NOT NULL,
  verdict TEXT NOT NULL,
  source_file_name TEXT,
  recommended_additions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, sample_id)
);

CREATE TABLE IF NOT EXISTS sand_batches (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_no TEXT NOT NULL,
  test_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  sand_system TEXT NOT NULL,
  moisture_pct NUMERIC(6,2) NOT NULL,
  permeability NUMERIC(8,2) NOT NULL,
  gcs_kg_cm2 NUMERIC(8,2) NOT NULL,
  afs_gfn NUMERIC(8,2) NOT NULL,
  loi_pct NUMERIC(6,2) NOT NULL,
  resin_pct NUMERIC(6,2) NOT NULL,
  hardener_pct NUMERIC(6,2) NOT NULL,
  tested_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, batch_no)
);

CREATE TABLE IF NOT EXISTS mould_logs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  shift TEXT NOT NULL,
  work_order_no TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  moulder_name TEXT NOT NULL,
  target_moulds INTEGER NOT NULL,
  achieved_moulds INTEGER NOT NULL,
  cores_prepared INTEGER NOT NULL DEFAULT 0,
  closed_moulds INTEGER NOT NULL DEFAULT 0,
  poured_heat_no TEXT,
  sand_batch_no TEXT NOT NULL,
  tag_range_start TEXT NOT NULL,
  tag_range_end TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS casting_tags (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  work_order_no TEXT NOT NULL,
  item_name TEXT NOT NULL,
  customer TEXT NOT NULL,
  grade_code TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  heat_no TEXT NOT NULL,
  sand_batch_no TEXT NOT NULL,
  poured_date TEXT NOT NULL,
  pouring_temp_c INTEGER NOT NULL,
  ht_cycle_ref TEXT NOT NULL,
  ndt_results_json JSONB NOT NULL,
  weld_repair_ref TEXT,
  defect_code TEXT DEFAULT 'None',
  disposition TEXT NOT NULL DEFAULT 'In Fettling',
  mtc_no TEXT,
  challan_no TEXT,
  inspected_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_tags_org_wo ON casting_tags(org_id, work_order_no);

CREATE TABLE IF NOT EXISTS mtc_certificates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mtc_no TEXT NOT NULL,
  heat_no TEXT NOT NULL,
  work_order_no TEXT NOT NULL,
  customer TEXT NOT NULL,
  po_no TEXT NOT NULL,
  item_name TEXT NOT NULL,
  drawing_no TEXT NOT NULL,
  grade_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  certified_qty INTEGER NOT NULL,
  chemistry_actual_json JSONB NOT NULL,
  mechanical_actual_json JSONB NOT NULL,
  ndt_summary TEXT NOT NULL,
  tag_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  prepared_by TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, mtc_no)
);

CREATE TABLE IF NOT EXISTS dispatch_challans (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  challan_no TEXT NOT NULL,
  dispatch_date TEXT NOT NULL,
  work_order_no TEXT NOT NULL,
  customer TEXT NOT NULL,
  po_no TEXT NOT NULL,
  item_name TEXT NOT NULL,
  grade_code TEXT NOT NULL,
  mtc_no TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  transporter TEXT NOT NULL,
  lr_no TEXT NOT NULL DEFAULT '',
  tag_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  qty_pcs INTEGER NOT NULL,
  net_weight_kg NUMERIC(14,2) NOT NULL,
  invoice_value_rs NUMERIC(16,2) NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, challan_no)
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  machine_no TEXT NOT NULL,
  machine_name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Operational',
  health_pct INTEGER NOT NULL DEFAULT 100,
  last_pm_date TEXT NOT NULL,
  next_pm_due TEXT NOT NULL,
  running_hours INTEGER NOT NULL DEFAULT 0,
  open_breakdown_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, machine_no)
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slip_no TEXT NOT NULL,
  machine_no TEXT NOT NULL,
  machine_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  downtime_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  spares_used TEXT NOT NULL DEFAULT '',
  technician TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iso_records (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL,
  revision_no INTEGER NOT NULL DEFAULT 1,
  doc_number INTEGER NOT NULL,
  doc_title TEXT NOT NULL,
  created_at_label TEXT NOT NULL,
  prepared_by TEXT NOT NULL,
  verified_by TEXT,
  linked_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  ncr_note TEXT,
  values_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, submission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  diff_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id, created_at DESC);
`;export{T as POSTGRES_SCHEMA_SQL};
