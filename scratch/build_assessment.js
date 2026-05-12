const fs = require('fs');

const jsx = fs.readFileSync('scratch/adaptive_test.jsx', 'utf8');

const layoutCode = `import React from 'react';

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
`;

fs.mkdirSync('app/assessment', { recursive: true });
fs.writeFileSync('app/assessment/layout.tsx', layoutCode);

const pageCode = `import React from 'react';

export default function AssessmentPage() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;

fs.writeFileSync('app/assessment/page.tsx', pageCode);
console.log('Created assessment layout and page');
