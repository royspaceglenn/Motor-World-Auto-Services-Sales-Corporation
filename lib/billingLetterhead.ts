/** Seller / registrant block shown on per-transaction billing statement prints. */

export interface BillingLetterhead {
  registeredName: string;
  tin: string;
  businessAddress: string;
}

const KEYS = {
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

export function loadBillingLetterhead(): BillingLetterhead {
  try {
    return {
      registeredName: localStorage.getItem(KEYS.registeredName) ?? '',
      tin: localStorage.getItem(KEYS.tin) ?? '',
      businessAddress: localStorage.getItem(KEYS.address) ?? '',
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
    return localStorage.getItem(KEYS.prePrintedForm) === '1';
  } catch {
    return false;
  }
}

export function saveBillingPrePrintedFormPreference(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(KEYS.prePrintedForm, '1');
    else localStorage.removeItem(KEYS.prePrintedForm);
  } catch {
    /* ignore quota / private mode */
  }
}
