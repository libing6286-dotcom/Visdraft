import { Mail } from "lucide-react";

const CONTACT_EMAIL = "libing6286@gmail.com";

const copy = {
  en: {
    eyebrow: "Contact",
    title: "Get in touch",
    description:
      "Have a question about Visdraft, need support, or want to share feedback? Send an email and I will respond as soon as possible.",
    emailLabel: "Email",
    buttonLabel: "Email me",
    note:
      "Please include any relevant account, project, or billing context so I can understand your request quickly.",
    response: "Typical response time depends on request volume.",
  },
  zh: {
    eyebrow: "联系",
    title: "联系我",
    description:
      "如果你对 Visdraft 有问题、需要支持，或想提供反馈，可以通过邮件联系我。我会尽快回复。",
    emailLabel: "邮箱",
    buttonLabel: "发送邮件",
    note:
      "请尽量在邮件中附上相关账号、项目或账单信息，方便我更快理解你的请求。",
    response: "具体回复时间会根据请求量有所不同。",
  },
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "zh" ? copy.zh : copy.en;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {t.description}
          </p>
        </div>

        <div className="mt-10 rounded-lg border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t.emailLabel}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 block break-all text-lg font-semibold tracking-tight hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">{t.note}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t.buttonLabel}
            </a>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">{t.response}</p>
      </section>
    </main>
  );
}
