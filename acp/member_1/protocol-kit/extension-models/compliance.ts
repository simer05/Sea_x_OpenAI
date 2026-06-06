import type { SupportedCountry } from "../base-models/common";

export const COMPLIANCE_EXTENSION_NAMESPACE = "dev.acpsea.compliance" as const;

export const halalStatusValues = ["certified", "not_certified", "unknown"] as const;

export type HalalStatus = (typeof halalStatusValues)[number];

export const bpomStatusValues = ["registered", "not_registered", "not_required", "unknown"] as const;

export type BpomStatus = (typeof bpomStatusValues)[number];

export interface HalalMetadata {
  status: HalalStatus;
  certifier: string | null;
  certificate_id: string | null;
  expires_at: string | null;
}

export interface BpomMetadata {
  status: BpomStatus;
  registration_number: string | null;
  expires_at: string | null;
}

export interface CountryRule {
  country: SupportedCountry;
  applies_to: string;
  notes: string;
}

export interface ComplianceExtensionPayload {
  extension_id: string;
  namespace: typeof COMPLIANCE_EXTENSION_NAMESPACE;
  halal: HalalMetadata;
  bpom: BpomMetadata;
  country_rules: CountryRule[];
}
