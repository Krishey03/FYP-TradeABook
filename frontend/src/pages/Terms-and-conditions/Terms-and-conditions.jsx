import React from 'react';
import { useNavigate } from 'react-router-dom';

const sections = [
  { id: 'general', title: 'General Policies', emoji: '📌' },
  { id: 'exchange', title: 'Exchange Policy', emoji: '🔁' },
  { id: 'refund', title: 'Return & Refund', emoji: '📦' },
  { id: 'conduct', title: 'User Conduct', emoji: '👤' },
  { id: 'privacy', title: 'Privacy', emoji: '🔒' },
  { id: 'bidding', title: 'Bidding', emoji: '💸' },
  { id: 'timebound', title: 'Time‑bound Actions', emoji: '🕒' },
  { id: 'listings', title: 'Product Listings', emoji: '🛠️' },
];

const policies = {
  general: [
    <span key="g1">
      To have your product removed, email Admin at{' '}
      <a href="mailto:rk@gmail.com" className="text-indigo-600 hover:underline">
        rk@gmail.com
      </a>
    </span>,
    'Valid WhatsApp number required for communication',
    'Complete delivery address must be provided',
    <span key="g4">
      Contact Admin for any issues at{' '}
      <a href="mailto:rk@gmail.com" className="text-indigo-600 hover:underline">
        rk@gmail.com
      </a>
    </span>,
  ],
  exchange: [
    'Exchange offerer pays shipping costs',
    'All bidding/chat features disabled after accepted exchange',
  ],
  refund: [
    'Non-returnable/non-refundable after exchange',
    'Report damaged/incorrect books to the admin within 48 hours with photos',
  ],
  conduct: [
    'Respectful communication required',
    'Multiple failed bids may result in bans',
  ],
  privacy: [
    'Contact details only shared with transaction parties',
    'No data sold to third parties',
  ],
  bidding: [
    'Bids cannot be edited/withdrawn',
    'Complete purchase within 24 hours of acceptance',
  ],
  timebound: [
    '24-hour window for shipping payments',
    'Inactive listings archived after 30 days',
  ],
  listings: [
    'Clear images and accurate descriptions required',
    'False listings subject to removal',
  ],
};

function TermsAndConditions() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 w-full bg-white shadow border-b z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={goBack}
            className="text-white hover:text-gray-900 focus:outline-none"
          >
            Return
          </button>
          <h1 className="text-xl font-bold text-gray-800">Terms & Conditions</h1>
          <div className="w-8" /> {/* placeholder for symmetry */}
        </div>
      </header>

      <main className="pt-20 pb-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Table of Contents (desktop only) */}
          <nav className="hidden lg:block lg:col-span-1 sticky top-24 self-start px-6">
            <p className="uppercase text-sm font-semibold text-gray-500 mb-4">
              On this page
            </p>
            <ul className="space-y-2 text-gray-700 text-sm">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {s.emoji} {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="lg:col-span-4 px-6 space-y-16">
            {/* Intro */}
            <section id="intro">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                📚 Book Exchange Terms & Conditions
              </h2>
              <p className="text-gray-600">
                By using our platform, you agree to these terms. Last updated:{' '}
                <time dateTime={new Date().toISOString().split('T')[0]}>
                  {new Date().toLocaleDateString()}
                </time>
                .
              </p>
            </section>

            {/* Sections */}
            {sections.map(({ id, title, emoji }) => (
              <Section key={id} id={id} title={title} emoji={emoji}>
                <PolicyList id={id} />
              </Section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const Section = ({ id, title, emoji, children }) => (
  <section id={id} className="scroll-mt-20">
    <h3 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
      <span className="mr-2">{emoji}</span> {title}
    </h3>
    <div className="border-l-2 border-indigo-500 pl-4">{children}</div>
  </section>
);

const PolicyList = ({ id }) => (
  <ul className="space-y-3">
    {policies[id].map((item, idx) => (
      <li key={idx} className="flex items-start text-gray-700">
        <span className="flex-shrink-0 text-indigo-500 mr-3 mt-1">•</span>
        <span className="flex-1">{item}</span>
      </li>
    ))}
  </ul>
);

export default TermsAndConditions;
