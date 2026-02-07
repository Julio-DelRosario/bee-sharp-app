"use client"

export default function OutputScreen({ onReset }: { onReset: () => void }) {
  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="max-w-xl text-center">
        <h2 className="text-2xl font-semibold">Result</h2>
        <p className="mt-3 text-sm text-slate-700">Here’s the generated output.</p>
        <div className="mt-6">
          <button
            onClick={onReset}
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Start Over
          </button>
        </div>
      </div>
    </section>
  )
}
