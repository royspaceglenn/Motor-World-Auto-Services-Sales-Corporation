/** Seller / registrant block shown on per-transaction billing statement prints. */

export interface BillingLetterhead {
  registeredName: string;
  tin: string;
  businessAddress: string;
}

const KEYS = {
  registeredName: 'mw_tx_billing_registered_name',
  tin: 'mw_tx_billing_tin',
  address: 'mw_tx_billing_business_address',
  prePrintedForm: 'mw_tx_billing_pre_printed_form',
} as const;

const LEGACY_KEYS = {
  registeredName: 'efcp_tx_billing_registered_name',
  tin: 'efcp_tx_billing_tin',
  address: 'efcp_tx_billing_business_address',
  prePrintedForm: 'efcp_tx_billing_pre_printed_form',
} as const;

const defaults: BillingLetterhead = {
  registeredName: '',
  tin: '',
  businessAddress: '',
};

function readWithLegacy(key: keyof typeof KEYS): string {
  try {
    const next = localStorage.getItem(KEYS[key]);
    if (next != null && next !== '') return next;
    const leg = localStorage.getItem(LEGACY_KEYS[key]);
    if (leg != null && leg !== '') {
      localStorage.setItem(KEYS[key], leg);
      localStorage.removeItem(LEGACY_KEYS[key]);
      return leg;
    }
    return '';
  } catch {
    return '';
  }
}

export function loadBillingLetterhead(): BillingLetterhead {
  try {
    return {
      registeredName: readWithLegacy('registeredName'),
      tin: readWithLegacy('tin'),
      businessAddress: readWithLegacy('address'),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveBillingLetterhead(data: BillingLetterhead): void {
  try {
    localStorage.setItem(KEYS.registeredName, data.registeredName.trim());
    localStorage.setItem(KEYS.tin, data.tin.trim());
    localStorage.setItem(KEYS.address, data.businessAddress.trim());
    localStorage.removeItem(LEGACY_KEYS.registeredName);
    localStorage.removeItem(LEGACY_KEYS.tin);
    localStorage.removeItem(LEGACY_KEYS.address);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * When true AND the sale fits on the pre-printed BIR invoice form
 * (≤ 9 item lines), only the variable values are printed, positioned
 * to overlay the pre-printed paper. Sales with > 9 lines always print
 * the full letterhead billing statement, regardless of this setting.
 */
export function loadBillingPrePrintedFormPreference(): boolean {
  try {
    if (localStorage.getItem(KEYS.prePrintedForm) === '1') return true;
    if (localStorage.getItem(LEGACY_KEYS.prePrintedForm) === '1') {
      localStorage.setItem(KEYS.prePrintedForm, '1');
      localStorage.removeItem(LEGACY_KEYS.prePrintedForm);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function saveBillingPrePrintedFormPreference(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(KEYS.prePrintedForm, '1');
    else localStorage.removeItem(KEYS.prePrintedForm);
    localStorage.removeItem(LEGACY_KEYS.prePrintedForm);
  } catch {
    /* ignore quota / private mode */
  }
}
