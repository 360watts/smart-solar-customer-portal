"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle, CheckCircle } from "lucide-react";

export type InquiryTextField = {
  type: "text" | "email" | "tel";
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
  pattern?: string;
  title?: string;
  inputMode?: "tel";
};

export type InquirySelectField = {
  type: "select";
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

export type InquiryTheme = "green" | "orange";

const THEME: Record<InquiryTheme, {
  focusBorder: string;
  submitClassName: string;
  submitStyle?: React.CSSProperties;
  successIconBg: string;
  successIconColor: string;
  resetColor: string;
}> = {
  green: {
    focusBorder: "focus:border-[#015c40]",
    submitClassName: "bg-linear-to-r from-[#00a63e] to-[#007a55] shadow-[0_4px_15px_rgba(0,166,62,0.25)] hover:shadow-[0_8px_30px_rgba(0,166,62,0.35)]",
    successIconBg: "bg-green-100",
    successIconColor: "text-[#015c40]",
    resetColor: "text-[#015c40]",
  },
  orange: {
    focusBorder: "focus:border-[#ff6900]",
    submitClassName: "",
    submitStyle: { backgroundImage: "linear-gradient(170deg, #fdc700 0%, #ff6900 100%)" },
    successIconBg: "bg-orange-100",
    successIconColor: "text-[#ff6900]",
    resetColor: "text-[#ff6900]",
  },
};

const FIELD_CLASS = "w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none bg-transparent";
const LABEL_CLASS = "block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1";

export type InquiryFormProps = {
  theme: InquiryTheme;
  /** First N fields rendered in a 2-col grid — every field this form needs except the trailing select + message. */
  gridFields: InquiryTextField[];
  selectField: InquirySelectField;
  messageField: { name: string; label: string; placeholder: string; multiline?: boolean };
  submitLabel: string;
  submittingLabel: string;
  endpoint: string;
  buildSubject: (data: Record<string, string>) => string;
  whatsappPhone: string;
  buildWhatsAppMessage: (data: Record<string, string>) => string;
  success: {
    heading: string;
    body1: string;
    body2: string;
    whatsappLabel: string;
    resetLabel: string;
  };
};

function initialData(props: InquiryFormProps): Record<string, string> {
  const data: Record<string, string> = {};
  for (const f of props.gridFields) data[f.name] = "";
  data[props.selectField.name] = props.selectField.options[0]?.value ?? "";
  data[props.messageField.name] = "";
  return data;
}

/**
 * Shared shape behind the marketing site's two contact forms (customer
 * inquiry, partnership inquiry) — same fields-grid → select → message →
 * submit layout, same formsubmit.co + WhatsApp-fallback submit flow, same
 * success/reset screen, parameterized by theme, field set, and copy. These
 * used to be two hand-duplicated ~100-line forms; the actual difference
 * between them is field set (city+interest vs. company+partnerType, input
 * vs. textarea message) and color theme, not the underlying mechanism.
 */
export function InquiryForm(props: InquiryFormProps) {
  const { theme, gridFields, selectField, messageField, submitLabel, submittingLabel, endpoint, buildSubject, whatsappPhone, buildWhatsAppMessage, success } = props;
  const t = THEME[theme];

  const [data, setData] = useState<Record<string, string>>(() => initialData(props));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const sendViaWhatsApp = () => {
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(buildWhatsAppMessage(data))}`, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          ...data,
          message: data[messageField.name] || "No message provided",
          _subject: buildSubject(data),
          _captcha: "false",
          _template: "table",
        }),
      });
      if (!response.ok) throw new Error("Failed");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const reset = () => {
    setIsSubmitted(false);
    setData(initialData(props));
  };

  if (isSubmitted) {
    return (
      <div className="text-center" aria-live="polite">
        <div className={`w-20 h-20 ${t.successIconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <CheckCircle className={`w-10 h-10 ${t.successIconColor}`} />
        </div>
        <h3 className="text-[28px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-4">Thank You!</h3>
        <p className="text-[17px] text-[#4a5565] mb-2">{success.body1}</p>
        <p className="text-[15px] text-[#4a5565] mb-8">{success.body2}</p>

        <div className="space-y-4 max-w-2xl mx-auto mb-8">
          <button
            onClick={sendViaWhatsApp}
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            {success.whatsappLabel}
          </button>
        </div>

        <button onClick={reset} className={`${t.resetColor} font-medium hover:underline font-['Poppins']`}>
          {success.resetLabel}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 md:gap-y-6 lg:gap-y-15 gap-x-3 sm:gap-x-6 md:gap-x-8 lg:gap-x-50">
        {gridFields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className={LABEL_CLASS}>{field.label}</label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={data[field.name]}
              onChange={handleChange}
              required={field.required}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              pattern={field.pattern}
              title={field.title}
              className={`${FIELD_CLASS} ${t.focusBorder}`}
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor={selectField.name} className={LABEL_CLASS}>{selectField.label}</label>
        <div className="relative">
          <select
            id={selectField.name}
            name={selectField.name}
            value={data[selectField.name]}
            onChange={handleChange}
            required
            className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-[10px] border border-[rgba(0,0,0,0.4)] appearance-none bg-white text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px]"
          >
            {selectField.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-[#0a0a0a]/40" />
        </div>
      </div>

      <div>
        <label htmlFor={messageField.name} className={LABEL_CLASS}>{messageField.label}</label>
        {messageField.multiline ? (
          <textarea
            id={messageField.name}
            name={messageField.name}
            placeholder={messageField.placeholder}
            value={data[messageField.name]}
            onChange={handleChange}
            autoComplete="off"
            rows={4}
            className={`w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border border-gray-300 rounded-[10px] p-2.5 sm:p-3 focus:outline-none ${t.focusBorder} bg-transparent resize-none`}
          />
        ) : (
          <input
            type="text"
            id={messageField.name}
            name={messageField.name}
            placeholder={messageField.placeholder}
            value={data[messageField.name]}
            onChange={handleChange}
            autoComplete="off"
            className={`${FIELD_CLASS} ${t.focusBorder}`}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={t.submitStyle}
        className={`w-full py-2.5 sm:py-3 md:py-3.5 lg:py-4 text-white font-semibold rounded-lg sm:rounded-[10px] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] hover:opacity-90 transition-all disabled:opacity-70 font-['Poppins'] ${t.submitClassName}`}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
