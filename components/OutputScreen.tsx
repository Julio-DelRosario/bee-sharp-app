"use client"

type OutputData = {
  status: string;
  content?: { type: string; value: string }[];
  message?: string;
  groqResponse?: string;
};

export default function OutputScreen({
  onReset,
  data,
}: {
  onReset: () => void;
  data: OutputData | null;
}) {
  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="max-w-xl text-center">
        <h2 className="text-2xl font-semibold">Result</h2>
        <p className="mt-3 text-sm text-slate-700">Here’s the generated output.</p>
        <div className="mt-4 text-left bg-slate-950 text-slate-50 rounded-lg p-4 text-xs overflow-auto max-h-80">
          <pre>
            {data
              ? data.groqResponse || JSON.stringify(data, null, 2)
              : "{}"}
          </pre>
        </div>
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
