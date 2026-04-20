import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold">{t("compare.title", { current: 0, max: 3 })}</h1>
      <p className="text-sm text-muted-foreground">
        {locale === "zh" ? "对比独立页将在第二阶段完成，此入口已预留。" : "Dedicated compare page is planned for phase 2."}
      </p>
      <Link href={`/${locale}`} className="text-sm text-primary underline-offset-4 hover:underline">
        {locale === "zh" ? "返回首页继续搜索" : "Back to home"}
      </Link>
    </main>
  )
}
