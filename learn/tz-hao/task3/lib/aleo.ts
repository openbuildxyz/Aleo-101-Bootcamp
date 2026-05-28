export const PROGRAM_ID = "privateresume_mvp_20260527.aleo";
export const CHAIN_ID = "testnetbeta";
export const DEFAULT_FEE_MICROCREDITS = 100_000;

export type ResumeDraft = {
  solidity: boolean;
  react: boolean;
  years: number;
};

export type VerifyRequirement = {
  needSolidity: boolean;
  minYears: number;
};

export function qualifies(resume: ResumeDraft, requirement: VerifyRequirement) {
  const solidityOk = !requirement.needSolidity || resume.solidity;
  return solidityOk && resume.years >= requirement.minYears;
}

export function toLeoBool(value: boolean) {
  return value ? "true" : "false";
}

export function toLeoU8(value: number) {
  const safe = Math.max(0, Math.min(255, Math.trunc(value)));
  return `${safe}u8`;
}
