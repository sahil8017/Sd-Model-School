import logo from "@/assets/logo.png";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export function SchoolFooter() {
  return (
    <footer className="relative border-t border-white/10 mt-10">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ── Left: School identity ─────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md ring-1 ring-white/20">
                <img src={logo} alt="S.D.Model Sr. Sec. School" className="h-full w-auto object-contain" />
              </span>
              <div>
                <div
                  className="font-bold text-white text-base leading-tight"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  S.D.Model Sr. Sec. School
                </div>
                <div className="text-[11px] text-white/55 mt-0.5">
                  (Co-educational English Medium School)
                </div>
              </div>
            </div>
            <div className="text-[11px] text-white/50 leading-relaxed">
              <div>Affiliated to C. B. S.E. , New Delhi</div>
              <div>Code No. 530224</div>
              <div className="mt-1">Railway Road, Karnal - 132001</div>
            </div>
          </div>

          {/* ── Right: Contact ────────────────────────────────── */}
          <div>
            <h3
              className="text-sm font-semibold text-white mb-4"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Contact Us
            </h3>
            <ul className="space-y-3">
              {[
                { Icon: MapPin,  text: "Railway Road, Karnal - 132001" },
                { Icon: Phone,   text: "0184 - 2253092" },
                { Icon: Mail,    text: "sdmodelsrsecschoolknl@gmail.com" },
                { Icon: Globe,   text: "www.sdmodelkarnal.com" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-[12px] text-white/65">
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-crimson" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <div className="mt-8 border-t border-white/10 pt-4 text-center text-[10px] text-white/35">
          © {new Date().getFullYear()} S.D.Model Sr. Sec. School, Karnal · Affiliated to C.B.S.E.
        </div>
      </div>
    </footer>
  );
}
