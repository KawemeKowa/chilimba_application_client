'use client';

import Link from 'next/link';
import {
  Users, Shield, Coins, Smartphone, ArrowLeft,
  Mail, Phone, MapPin, Globe2, TrendingUp, HandHeart
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Group Savings',
    description: 'Create or join savings circles with trusted people. Set contribution schedules and manage members transparently.',
  },
  {
    icon: HandHeart,
    title: 'Crowd Funding',
    description: 'Pool resources for shared goals — funerals, weddings, emergencies — with full visibility into every contribution.',
  },
  {
    icon: TrendingUp,
    title: 'Rotating Payouts',
    description: 'Every member gets their turn. Automated payout scheduling ensures fair distribution across all group cycles.',
  },
  {
    icon: Shield,
    title: 'Multi-Level Approvals',
    description: 'Withdrawals require group consensus. Configurable approval thresholds prevent unauthorised access to funds.',
  },
  {
    icon: Coins,
    title: 'Multi-Currency',
    description: 'Operate in ZMW, USD, EUR, GBP, or ZAR. Each group sets its own currency to match member preferences.',
  },
  {
    icon: Smartphone,
    title: 'Email Invitations',
    description: 'Invite members by email with a single click. New users are guided through onboarding and added automatically.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">

      {/* Top bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-teal-600 font-bold text-base">CHILIMBA</span>
          </div>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-2">
            <span className="text-white text-3xl font-bold">C</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">Chilimba</h1>
          <p className="text-xl text-teal-600 dark:text-teal-400 font-medium">Digital Village Banking & Crowd Funding</p>
          <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-lg">
            Chilimba brings the trusted tradition of village banking into the digital age. We make it easy for communities
            to save together, fund each other through hardship, and grow their financial wellbeing — transparently and securely.
          </p>
        </section>

        {/* What we do */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">What we do</h2>
          <div className="w-12 h-1 bg-teal-600 rounded mb-6" />
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            Chilimba is a platform for managing savings groups — sometimes called chilimbas, chamas, or stokvels — where members
            pool money periodically and take turns receiving the full pot. Beyond rotating savings, groups can run crowd-funding
            committees for specific causes, request withdrawals with peer approval, and track every transaction in real time.
          </p>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Our goal is to replace spreadsheets and handshakes with a reliable, auditable digital record that every member
            can trust — while keeping the community spirit that makes these groups so powerful.
          </p>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Features</h2>
          <div className="w-12 h-1 bg-teal-600 rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 space-y-3"
              >
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <Icon size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">About the company</h2>
          <div className="w-12 h-1 bg-teal-600 rounded mb-6" />
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-teal-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <Globe2 size={24} className="text-teal-200" />
                <div>
                  <h3 className="text-white font-bold text-lg">Velora Solutions</h3>
                  <p className="text-teal-200 text-sm">Technology for financial inclusion</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                Velora Solutions is a Zambian technology company focused on building digital tools that improve everyday financial
                lives. Chilimba is our flagship product, designed in close collaboration with savings group communities across Zambia.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <MapPin size={17} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">477 Central Street<br />Chudleigh, Lusaka<br />Zambia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={17} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Email</p>
                    <a
                      href="mailto:kawemekowa@gmail.com"
                      className="text-sm text-teal-600 dark:text-teal-400 hover:underline break-all"
                    >
                      kawemekowa@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={17} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                    <a
                      href="tel:+260978087633"
                      className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      +260 978 087 633
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </section>

      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
        © {new Date().getFullYear()} Velora Solutions. All rights reserved.
      </footer>
    </div>
  );
}
