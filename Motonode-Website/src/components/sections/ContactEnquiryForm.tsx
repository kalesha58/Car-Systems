import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig } from "@/config/site";

const TOPICS = [
  { value: "support", label: "Support" },
  { value: "services", label: "Services" },
  { value: "parts", label: "Parts" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
] as const;

type TopicValue = (typeof TOPICS)[number]["value"];

interface EnquiryFormState {
  fullName: string;
  email: string;
  phone: string;
  topic: TopicValue | "";
  message: string;
}

type EnquiryErrors = Partial<Record<keyof EnquiryFormState, string>>;

const initialState: EnquiryFormState = {
  fullName: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

const fieldClass =
  "h-12 bg-background border-border text-foreground rounded-xl px-4 focus-visible:ring-primary/30";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return digits.slice(1);
  }
  return null;
}

function validate(form: EnquiryFormState): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = form.fullName.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (name.length < 2) {
    errors.fullName = "Please enter your full name.";
  }
  if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!normalizeIndianMobile(form.phone)) {
    errors.phone = "Please enter a valid 10-digit mobile number.";
  }
  if (!form.topic) {
    errors.topic = "Please select a topic.";
  }
  if (message.length < 10) {
    errors.message = "Please share a short message (at least 10 characters).";
  }

  return errors;
}

export function ContactEnquiryForm() {
  const [form, setForm] = useState<EnquiryFormState>(initialState);
  const [errors, setErrors] = useState<EnquiryErrors>({});

  const updateField = <K extends keyof EnquiryFormState>(key: K, value: EnquiryFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const topicLabel = TOPICS.find((topic) => topic.value === form.topic)?.label ?? form.topic;
    const mobile = normalizeIndianMobile(form.phone) ?? form.phone.replace(/\D/g, "");
    const whatsappNumber = siteConfig.contact.phoneE164.replace(/\D/g, "");

    const body = [
      "*Moto Node Enquiry*",
      "",
      `*Full Name:* ${form.fullName.trim()}`,
      `*Email:* ${form.email.trim()}`,
      `*Mobile:* ${mobile}`,
      `*Topic:* ${topicLabel}`,
      `*Message:* ${form.message.trim()}`,
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(body)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="enquiry-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Full Name
          </Label>
          <Input
            id="enquiry-name"
            name="fullName"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Enter your name"
            aria-invalid={Boolean(errors.fullName)}
            className={fieldClass}
          />
          {errors.fullName ? <p className="text-xs text-destructive ml-1">{errors.fullName}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="enquiry-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Email Address
          </Label>
          <Input
            id="enquiry-email"
            type="email"
            name="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
            maxLength={120}
            autoComplete="email"
            placeholder="you@email.com"
            aria-invalid={Boolean(errors.email)}
            className={fieldClass}
          />
          {errors.email ? <p className="text-xs text-destructive ml-1">{errors.email}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="enquiry-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Mobile Number
          </Label>
          <Input
            id="enquiry-phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
            maxLength={15}
            autoComplete="tel"
            inputMode="tel"
            placeholder="10-digit mobile number"
            aria-invalid={Boolean(errors.phone)}
            className={fieldClass}
          />
          {errors.phone ? <p className="text-xs text-destructive ml-1">{errors.phone}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="enquiry-topic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Topic
          </Label>
          <Select
            value={form.topic || undefined}
            onValueChange={(value) => {
              const nextTopic = TOPICS.find((topic) => topic.value === value);
              if (nextTopic) {
                updateField("topic", nextTopic.value);
              }
            }}
          >
            <SelectTrigger
              id="enquiry-topic"
              aria-invalid={Boolean(errors.topic)}
              className="h-12 w-full bg-background border-border text-foreground rounded-xl px-4 focus:ring-primary/30"
            >
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.topic ? <p className="text-xs text-destructive ml-1">{errors.topic}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="enquiry-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
          Message
        </Label>
        <Textarea
          id="enquiry-message"
          name="message"
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          required
          maxLength={1000}
          placeholder="How can the Moto Node team help?"
          aria-invalid={Boolean(errors.message)}
          className="min-h-32 bg-background border-border text-foreground rounded-xl p-4 resize-none focus-visible:ring-primary/30"
        />
        {errors.message ? <p className="text-xs text-destructive ml-1">{errors.message}</p> : null}
      </div>

      <Button type="submit" className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-md rounded-xl">
        Send on WhatsApp <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Submitting opens WhatsApp with your enquiry ready for the Moto Node team.
      </p>
    </form>
  );
}
