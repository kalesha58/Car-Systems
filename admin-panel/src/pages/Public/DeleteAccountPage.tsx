import { useEffect } from 'react';

import { IDeleteAccountMeta } from './DeleteAccountPage.interfaces';

const META: IDeleteAccountMeta = {
  appName: 'Motonode',
  developerName: 'Bandi Theja Swaroop',
  contactEmail: 'swarooptheja809@gmail.com',
};

export const DeleteAccountPage = () => {
  useEffect(() => {
    document.title = `${META.appName} — Account deletion`;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {META.appName} — Account deletion
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This page is public. You do not need to sign in to the admin panel to read these instructions.
          </p>

          <dl className="mt-8 space-y-4 text-sm sm:text-base">
            <div>
              <dt className="font-semibold text-slate-800">App name</dt>
              <dd className="mt-1 text-slate-700">{META.appName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">Developer</dt>
              <dd className="mt-1 text-slate-700">{META.developerName}</dd>
            </div>
          </dl>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">How to delete your account</h2>

            <h3 className="mt-6 text-base font-semibold text-slate-800">Option 1 (recommended)</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              <li>Open the Motonode app</li>
              <li>Go to Profile → Settings → Delete Account</li>
            </ul>

            <h3 className="mt-8 text-base font-semibold text-slate-800">Option 2</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                Email:{' '}
                <a
                  className="font-medium text-blue-600 underline underline-offset-2"
                  href={`mailto:${META.contactEmail}`}
                >
                  {META.contactEmail}
                </a>
              </li>
              <li>Subject: Account Deletion Request</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">What happens after deletion?</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Your account will be permanently deleted</li>
              <li>Your personal data will be deleted within 7–30 days</li>
              <li>Some data may be retained for legal purposes</li>
            </ul>
          </section>

          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p className="mt-3 text-slate-700">
              Email:{' '}
              <a
                className="font-medium text-blue-600 underline underline-offset-2"
                href={`mailto:${META.contactEmail}`}
              >
                {META.contactEmail}
              </a>
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};
