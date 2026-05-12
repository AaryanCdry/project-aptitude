const fs = require('fs');
const path = require('path');

function createDashboard(role, sourceFile, hasAside, hasNav) {
  const jsx = fs.readFileSync(sourceFile, 'utf8');
  
  let sidebarMatch = null;
  if (hasAside) sidebarMatch = jsx.match(/<aside[\s\S]*?<\/aside>/i);
  if (hasNav) sidebarMatch = jsx.match(/<nav[\s\S]*?<\/nav>/i);
  
  const headerMatch = jsx.match(/<header[\s\S]*?<\/header>/i);

  const layoutCode = `import React from 'react';

export default function ${role.charAt(0).toUpperCase() + role.slice(1)}Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      ${sidebarMatch ? sidebarMatch[0] : ''}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        ${headerMatch ? headerMatch[0] : ''}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
`;

  const dir = `app/(dashboard)/${role}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'layout.tsx'), layoutCode);

  // For the page, grab the content below header
  // They usually have <div className="p-margin-desktop..."> or <main className="flex-1 p-margin-desktop bg-background overflow-y-auto">
  // We'll extract everything after </header> until </main> or end of file
  let pageContent = '';
  const headerEndIdx = headerMatch ? jsx.indexOf(headerMatch[0]) + headerMatch[0].length : 0;
  const mainEndIdx = jsx.lastIndexOf('</main>');
  if (mainEndIdx !== -1) {
    pageContent = jsx.substring(headerEndIdx, mainEndIdx).trim();
  } else {
    pageContent = jsx.substring(headerEndIdx).trim();
  }

  // Remove trailing </div> if any because the wrapper in main might be incomplete but we'll wrap it in a fragment.
  const pageCode = `import React from 'react';

export default function ${role.charAt(0).toUpperCase() + role.slice(1)}Dashboard() {
  return (
    <>
      ${pageContent}
    </>
  );
}
`;

  fs.writeFileSync(path.join(dir, 'page.tsx'), pageCode);
  console.log(`Created ${role} layout and page`);
}

createDashboard('student', 'scratch/student_dashboard.jsx', true, false);
createDashboard('admin', 'scratch/admin_dashboard.jsx', false, true);
createDashboard('mentor', 'scratch/mentor_dashboard.jsx', true, true); // wait, mentor has nav or aside?

