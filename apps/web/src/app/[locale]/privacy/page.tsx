import { Link } from "@/i18n/navigation";

type PrivacySection = {
  id: string;
  title: string;
  body: string[];
};

type PrivacyCopy = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  notice: string;
  sections: PrivacySection[];
  contactTitle: string;
  contactBody: string;
  homeLabel: string;
};

const privacyCopy: Record<"en" | "zh", PrivacyCopy> = {
  en: {
    eyebrow: "Privacy Policy",
    title: "How Visdraft handles your information",
    updated: "Last updated: July 26, 2026",
    intro:
      "This Privacy Policy explains how Visdraft collects, uses, stores, and shares information when you visit our website or use our AI creative workspace.",
    notice:
      "This policy is provided as a practical product privacy notice. It should be reviewed by qualified counsel before being used as a formal legal document.",
    sections: [
      {
        id: "information-we-collect",
        title: "Information we collect",
        body: [
          "We may collect account information such as your name, email address, authentication details, workspace membership, and preferences.",
          "We may collect creative workspace content that you choose to provide, including prompts, uploaded assets, generated images or videos, brand materials, project names, and canvas activity.",
          "We may collect technical and usage information such as device type, browser, IP address, pages visited, feature usage, diagnostics, and approximate timestamps.",
          "If you purchase a paid plan, payment details are processed by our payment providers. Visdraft does not store full card numbers.",
        ],
      },
      {
        id: "how-we-use-information",
        title: "How we use information",
        body: [
          "We use information to provide the service, authenticate users, create and manage projects, generate creative outputs, process subscriptions, and maintain account security.",
          "We may use usage and diagnostic data to improve reliability, understand feature performance, prevent abuse, and develop new product capabilities.",
          "We may use your contact information to send service notices, security updates, billing messages, and product communications where permitted.",
        ],
      },
      {
        id: "service-providers",
        title: "AI providers and service providers",
        body: [
          "Visdraft may rely on infrastructure, authentication, storage, payment, analytics, and AI model providers to operate the product.",
          "When you request AI generation, the prompts, files, and related context needed to complete the request may be sent to selected model providers. Their processing is limited to what is needed to provide the requested functionality, subject to their terms and configurations.",
        ],
      },
      {
        id: "sharing",
        title: "Sharing and disclosure",
        body: [
          "We do not sell personal information.",
          "We may share information with service providers that help us operate Visdraft, with workspace members you collaborate with, when required by law, to protect rights and safety, or as part of a merger, acquisition, financing, or similar business transaction.",
        ],
      },
      {
        id: "retention",
        title: "Data retention",
        body: [
          "We keep information for as long as needed to provide the service, comply with legal obligations, resolve disputes, enforce agreements, and maintain security.",
          "You may delete certain projects or account information through the product where supported. Backups and logs may persist for a limited period before deletion.",
        ],
      },
      {
        id: "security",
        title: "Security",
        body: [
          "We use reasonable administrative, technical, and organizational measures designed to protect information. No system is perfectly secure, and we cannot guarantee absolute security.",
        ],
      },
      {
        id: "rights",
        title: "Your choices and rights",
        body: [
          "Depending on your location, you may have rights to access, correct, delete, export, restrict, or object to certain processing of your personal information.",
          "You can also choose not to provide certain information, but some features may not work without it.",
        ],
      },
      {
        id: "children",
        title: "Children's privacy",
        body: [
          "Visdraft is not directed to children under 13, and we do not knowingly collect personal information from children under 13.",
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        body: [
          "We may update this Privacy Policy from time to time. When we make material changes, we will update the date above and provide additional notice where appropriate.",
        ],
      },
    ],
    contactTitle: "Contact",
    contactBody:
      "For privacy questions or requests, contact Visdraft at privacy@visdraft.com.",
    homeLabel: "Back to Visdraft",
  },
  zh: {
    eyebrow: "隐私政策",
    title: "Visdraft 如何处理你的信息",
    updated: "最后更新：2026 年 7 月 26 日",
    intro:
      "本隐私政策说明你访问 Visdraft 网站或使用 AI 创意工作空间时，我们如何收集、使用、存储和共享信息。",
    notice:
      "本文是面向产品使用场景的隐私说明，作为正式法律文件使用前，建议由具备资质的法律顾问审阅。",
    sections: [
      {
        id: "information-we-collect",
        title: "我们收集的信息",
        body: [
          "我们可能收集账号信息，例如姓名、电子邮箱、认证信息、工作空间成员关系和偏好设置。",
          "我们可能收集你主动提供的创意工作内容，包括提示词、上传素材、生成的图片或视频、品牌素材、项目名称和画布操作。",
          "我们可能收集技术和使用信息，例如设备类型、浏览器、IP 地址、访问页面、功能使用、诊断信息和大致时间戳。",
          "如果你购买付费方案，付款信息由支付服务商处理。Visdraft 不存储完整银行卡号。",
        ],
      },
      {
        id: "how-we-use-information",
        title: "我们如何使用信息",
        body: [
          "我们使用信息来提供服务、认证用户、创建和管理项目、生成创意内容、处理订阅以及维护账号安全。",
          "我们可能使用使用情况和诊断数据来提升可靠性、了解功能表现、防止滥用并开发新的产品能力。",
          "在法律允许的范围内，我们可能使用你的联系方式发送服务通知、安全更新、账单消息和产品沟通。",
        ],
      },
      {
        id: "service-providers",
        title: "AI 供应商和服务商",
        body: [
          "Visdraft 可能依赖基础设施、认证、存储、支付、分析和 AI 模型服务商来运行产品。",
          "当你请求 AI 生成时，完成请求所需的提示词、文件和相关上下文可能会发送给所选模型服务商。相关处理限于提供请求功能所需的范围，并受其条款和配置约束。",
        ],
      },
      {
        id: "sharing",
        title: "共享和披露",
        body: [
          "我们不会出售个人信息。",
          "我们可能与帮助 Visdraft 运行的服务商、与你协作的工作空间成员共享信息；也可能在法律要求、保护权利和安全、或发生合并、收购、融资等类似交易时披露信息。",
        ],
      },
      {
        id: "retention",
        title: "数据保留",
        body: [
          "我们会在提供服务、履行法律义务、解决争议、执行协议和维护安全所需的期限内保留信息。",
          "你可以在产品支持的范围内删除部分项目或账号信息。备份和日志可能会在有限时间内继续保留，然后再删除。",
        ],
      },
      {
        id: "security",
        title: "安全",
        body: [
          "我们会采取合理的管理、技术和组织措施来保护信息。但没有任何系统可以保证绝对安全。",
        ],
      },
      {
        id: "rights",
        title: "你的选择和权利",
        body: [
          "根据你所在地区的法律，你可能有权访问、更正、删除、导出、限制或反对我们处理你的部分个人信息。",
          "你也可以选择不提供某些信息，但部分功能可能因此无法使用。",
        ],
      },
      {
        id: "children",
        title: "儿童隐私",
        body: [
          "Visdraft 并非面向 13 岁以下儿童提供，我们不会有意收集 13 岁以下儿童的个人信息。",
        ],
      },
      {
        id: "changes",
        title: "政策变更",
        body: [
          "我们可能不时更新本隐私政策。如有重大变更，我们会更新上方日期，并在适当情况下提供额外通知。",
        ],
      },
    ],
    contactTitle: "联系我们",
    contactBody:
      "如有隐私相关问题或请求，请通过 privacy@visdraft.com 联系 Visdraft。",
    homeLabel: "返回 Visdraft",
  },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = locale === "zh" ? privacyCopy.zh : privacyCopy.en;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 sm:py-20 lg:px-8">
        <header className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {copy.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {copy.intro}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{copy.updated}</p>
        </header>

        <div className="rounded-lg border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
          {copy.notice}
        </div>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block">
            <div className="sticky top-8 space-y-2 text-sm text-muted-foreground">
              {copy.sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.id}`}
                  className="block rounded-md px-2 py-1.5 hover:bg-muted hover:text-foreground"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          <article className="space-y-10">
            {copy.sections.map((section) => (
              <section
                key={section.title}
                id={section.id}
                className="scroll-mt-8 border-t pt-8 first:border-t-0 first:pt-0"
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="border-t pt-8">
              <h2 className="text-xl font-semibold tracking-tight">
                {copy.contactTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {copy.contactBody}
              </p>
            </section>

            <div className="border-t pt-8">
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy.homeLabel}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
