import Header from "../components/Header";
import InputScreen from "../components/InputScreen";

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900">
      <div className="flex min-h-screen max-w-full flex-col pb-4">
        <Header />

        <InputScreen />
      </div>
    </main>
  );
}
