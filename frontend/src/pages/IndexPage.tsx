import { Link } from "react-router-dom";
import { Train, ShieldCheck, User } from "lucide-react";

export default function IndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <Train className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Empty Run <span className="text-primary">Buster</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <Link
            to="/client/shipments"
            className="group relative flex flex-col items-center justify-center p-10 md:p-14 text-center rounded-3xl border bg-card p-6 text-card-foreground shadow-lg hover:shadow-2xl transition-all duration-300 border-primary/20 hover:-translate-y-2 hover:border-primary/50 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Увійти як Клієнт</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Бажаєте перевезти вантаж? Створюйте заявки та відстежуйте
              виконання.
            </p>
          </Link>

          <Link
            to="/manage/dashboard"
            className="group relative flex flex-col items-center justify-center p-10 md:p-14 text-center rounded-3xl border bg-card p-6 text-card-foreground shadow-lg hover:shadow-2xl transition-all duration-300 border-info/20 hover:-translate-y-2 hover:border-info/50 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-info/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="h-20 w-20 rounded-full bg-info/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-info/20 transition-all duration-300">
              <ShieldCheck className="h-10 w-10 text-info" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Увійти як Логіст</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Управляйте розподілом вагонів, контролюйте заявки та мінімізуйте
              витрати.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
