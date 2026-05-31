import React from "react";
import { Link } from "react-router-dom";
import shamhoLogo from "../../assets/Shamho Logo.jpeg";
import heroImage from "../../assets/hero.jpeg";

const navItems = [
  "Home",
  "About Us",
  "Our Services",
  "Work Culture",
  "Business Opportunity",
  "Member Corner",
  "Gallery",
  "Contact Us",
];

const socialItems = ["f", "yt", "x", "ig", "in"];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4efe6] text-slate-900">
      <header className="bg-white shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <img
                src={shamhoLogo}
                alt="SHAMHO logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-900">
                SHAMHO
              </h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="transition hover:text-[#2f69b1]"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[96rem] flex-col items-center gap-6 px-4 pb-10 pt-8 text-center sm:px-6 lg:px-8 lg:py-10">
        <section className="flex w-full max-w-2xl flex-col items-center gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
              Development in progress
            </p>
            <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl">
              SHAMHO ERP is being prepared for launch.
            </h2>
            <p className="text-base text-slate-600 sm:text-lg">
              Access the application through the login button below.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold !text-white transition hover:bg-emerald-700"
          >
            Login
          </Link>
        </section>

        <section className="relative w-full max-w-[96rem]">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white p-2 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 sm:p-3 lg:p-4">
            <div className="flex h-[56vh] w-full items-center justify-center overflow-hidden rounded-[1.25rem] bg-white sm:h-[64vh] lg:h-[72vh]">
              <img
                src={heroImage}
                alt="SHAMHO banner"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
