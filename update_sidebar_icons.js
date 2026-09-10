const fs = require('fs');

const path = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\components\\common\\Sidebar.jsx';
let code = fs.readFileSync(path, 'utf8');

const newIcons = `  DueList: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Buckets: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),`;

if (!code.includes('DueList: () =>')) {
  code = code.replace('  Transactions: () => (', newIcons + '\n  Transactions: () => (');
}

const oldResolver = `    if (key.includes('dashboard')) return <Icons.Dashboard />;
    if (key.includes('merchant config')) return <Icons.Config />;`;

const newResolver = `    if (key.includes('dashboard')) return <Icons.Dashboard />;
    if (key.includes('due') || key.includes('due-list')) return <Icons.DueList />;
    if (key.includes('bucket')) return <Icons.Buckets />;
    if (key.includes('merchant config')) return <Icons.Config />;`;

if (code.includes(oldResolver)) {
  code = code.replace(oldResolver, newResolver);
}

fs.writeFileSync(path, code, 'utf8');
console.log('✅ Sidebar.jsx updated with DueList and Buckets SVG icons!');
