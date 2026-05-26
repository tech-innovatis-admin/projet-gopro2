import { NavBar } from "@/components/ui/NavBar";

function pulseClassName(baseClassName: string) {
  return `${baseClassName} animate-pulse rounded bg-gray-200`;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden className={pulseClassName(className)} />;
}

function SkeletonTabNav() {
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-3 overflow-x-auto px-6 py-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock key={`tab-skeleton-${index}`} className="h-5 w-24 shrink-0" />
        ))}
      </div>
    </div>
  );
}

function SkeletonMetricCards({
  count,
  columnsClassName,
}: {
  count: number;
  columnsClassName: string;
}) {
  return (
    <div className={columnsClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`metric-card-skeleton-${index}`}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="mt-3 h-8 w-40" />
          <SkeletonBlock className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function SkeletonSectionCard({
  titleWidthClassName = "w-44",
  actionWidthClassName,
  rows = 4,
}: {
  titleWidthClassName?: string;
  actionWidthClassName?: string;
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className={`h-5 ${titleWidthClassName}`} />
        {actionWidthClassName ? (
          <SkeletonBlock className={`h-10 ${actionWidthClassName}`} />
        ) : null}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`section-row-skeleton-${titleWidthClassName}-${index}`}
            className="rounded-lg border border-gray-100 px-4 py-5"
          >
            <SkeletonBlock className="h-4 w-52" />
            <SkeletonBlock className="mt-3 h-3 w-full max-w-4xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContractTabLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`metric-skeleton-${index}`}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-8 w-40" />
            <SkeletonBlock className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-3xl" />
        <SkeletonBlock className="mt-2 h-4 w-full max-w-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`row-skeleton-${index}`}
              className="rounded-lg border border-gray-100 p-4"
            >
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-3 h-6 w-48" />
              <SkeletonBlock className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`list-skeleton-${index}`}
              className="rounded-lg border border-gray-100 px-4 py-5"
            >
              <SkeletonBlock className="h-4 w-52" />
              <SkeletonBlock className="mt-3 h-3 w-full max-w-4xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContractMetaLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SkeletonBlock className="h-7 w-52" />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>

      <SkeletonMetricCards
        count={3}
        columnsClassName="grid grid-cols-1 gap-2 sm:grid-cols-3"
      />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`meta-accordion-skeleton-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-9" />
                <SkeletonBlock className="h-9 w-9" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((__, childIndex) => (
                <div
                  key={`meta-accordion-row-${index}-${childIndex}`}
                  className="rounded-lg border border-slate-100 p-4"
                >
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="mt-3 h-6 w-48" />
                  <SkeletonBlock className="mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContractDisbursementLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBlock className="h-7 w-64" />
          <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-40" />
      </div>

      <SkeletonMetricCards
        count={5}
        columnsClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      />

      <SkeletonSectionCard titleWidthClassName="w-52" actionWidthClassName="w-28" rows={6} />
    </div>
  );
}

export function ContractLinkedItemsLoadingSkeleton({
  titleWidthClassName,
}: {
  titleWidthClassName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <SkeletonBlock className={`h-7 ${titleWidthClassName}`} />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 w-40" />
          <SkeletonBlock className="h-10 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`linked-card-skeleton-${index}`}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="mt-2 h-3 w-48" />
                <SkeletonBlock className="mt-2 h-3 w-36" />
              </div>
              <SkeletonBlock className="h-8 w-16" />
            </div>
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-8 w-24" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContractAuditLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-7 w-36" />
        <SkeletonBlock className="mt-3 h-4 w-64" />
      </div>

      <SkeletonSectionCard titleWidthClassName="w-56" rows={1} />

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`audit-card-skeleton-${index}`}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="mt-3 h-5 w-full max-w-xl" />
                <SkeletonBlock className="mt-2 h-3 w-full max-w-3xl" />
              </div>
              <SkeletonBlock className="h-8 w-24" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContractFilesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SkeletonBlock className="h-7 w-56" />
          <SkeletonBlock className="mt-3 h-4 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-8 w-24" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`file-row-skeleton-${index}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-56" />
                <SkeletonBlock className="mt-2 h-3 w-40" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-9" />
                <SkeletonBlock className="h-9 w-9" />
                <SkeletonBlock className="h-9 w-9" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContractRubricasLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="mt-3 h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 w-32" />
          <SkeletonBlock className="h-10 w-40" />
        </div>
      </div>

      <SkeletonMetricCards
        count={4}
        columnsClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      />

      <SkeletonSectionCard titleWidthClassName="w-48" actionWidthClassName="w-32" rows={7} />
    </div>
  );
}

export function ContractPagamentosLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonMetricCards
        count={5}
        columnsClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
      />
      <SkeletonSectionCard titleWidthClassName="w-44" actionWidthClassName="w-28" rows={4} />
      <SkeletonSectionCard titleWidthClassName="w-56" rows={6} />
    </div>
  );
}

export function ContractRouteLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-56" />
                <SkeletonBlock className="mt-4 h-8 w-full max-w-2xl" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-3xl" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
              </div>
              <div className="flex shrink-0 gap-3">
                <SkeletonBlock className="h-10 w-28" />
                <SkeletonBlock className="h-10 w-32" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`info-skeleton-${index}`} className="space-y-3">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-5 w-40" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <SkeletonTabNav />
            <div className="p-6">
              <ContractTabLoadingSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
