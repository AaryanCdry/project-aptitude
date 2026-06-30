import { listRegistrationCodes, generateRegistrationCode, revokeRegistrationCode } from '@/app/actions/super';
import CodesClient from './CodesClient';

export default async function RegistrationCodesPage() {
  const codes = await listRegistrationCodes();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Registration Codes</h1>
        <p className="font-body-md text-on-surface-variant">
          Generate alphanumeric codes to give to colleges so they can self-register on the platform.
        </p>
      </div>

      <CodesClient
        codes={codes}
        generateAction={generateRegistrationCode}
        revokeAction={revokeRegistrationCode}
      />
    </div>
  );
}
