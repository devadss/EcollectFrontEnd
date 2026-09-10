const fs = require('fs');

// 1. Update DueList.jsx
const duelistPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dues\\DueList.jsx';
let code = fs.readFileSync(duelistPath, 'utf8');

// Add pagination states
const oldStateAnchor = "  const [notification, setNotification] = useState(null);";
const paginationState = `  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);`;

code = code.replace(oldStateAnchor, paginationState);

// Add paginatedAccounts calculation and filter reset effect
const filteredAnchor = `      return matchesSearch && matchesStatus && matchesProduct && matchesAgent;
    });
  }, [accounts, searchTerm, statusFilter, productFilter, agentFilter]);`;

const paginatedLogic = `      return matchesSearch && matchesStatus && matchesProduct && matchesAgent;
    });
  }, [accounts, searchTerm, statusFilter, productFilter, agentFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, productFilter, agentFilter, pageSize]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAccounts.length);
  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, startIndex, endIndex]);`;

code = code.replace(filteredAnchor, paginatedLogic);

// Replace filteredAccounts.map in table with paginatedAccounts.map
const oldTableMap = `{filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <h3>No Due Records Found</h3>
                    <p>Upload a morning CBS due list to populate today's collection demand.</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, i) => {`;

const newTableMap = `{filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <h3>No Due Records Found</h3>
                    <p>Upload a morning CBS due list to populate today's collection demand.</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, i) => {`;

code = code.replace(oldTableMap, newTableMap);

// Add Pagination Controls Bar after </table>
const oldTableClose = `          </table>
        </div>`;

const newPaginationBar = `          </table>

          {/* Premium Pagination Bar */}
          {filteredAccounts.length > 0 && (
            <div className="due-pagination-bar">
              <div className="due-pagination-info">
                <span>
                  Showing <strong style={{ color: 'var(--textPrimary, #fff)' }}>{startIndex + 1}</strong> to <strong style={{ color: 'var(--textPrimary, #fff)' }}>{endIndex}</strong> of <strong style={{ color: '#818cf8' }}>{filteredAccounts.length}</strong> due accounts
                </span>
                
                <div className="due-page-size-selector">
                  <label htmlFor="pageSizeSelect" style={{ fontSize: '12px', color: 'var(--textMuted, #94a3b8)' }}>Rows per page:</label>
                  <select
                    id="pageSizeSelect"
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="due-page-size-select font-mono"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="due-pagination-nav">
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                >
                  ⏮️ First
                </button>
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  ◀ Prev
                </button>

                {/* Dynamic Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span style={{ padding: '0 4px', color: 'var(--textMuted, #64748b)' }}>...</span>
                        )}
                        <button
                          type="button"
                          className={\`btn-page-num font-mono \${currentPage === p ? 'is-active' : ''}\`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  Next ▶
                </button>
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                >
                  Last ⏭️
                </button>
              </div>
            </div>
          )}
        </div>`;

code = code.replace(oldTableClose, newPaginationBar);

fs.writeFileSync(duelistPath, code, 'utf8');
console.log('✅ Updated DueList.jsx with complete responsive pagination system!');

// 2. Append CSS to DueList.css
const cssPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dues\\DueList.css';
let css = fs.readFileSync(cssPath, 'utf8');

const paginationCss = `
/* ============================================================
   6. PAGINATION BAR (THEME ADAPTIVE & RESPONSIVE)
   ============================================================ */
.due-pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bgSecondary, rgba(15, 23, 42, 0.95));
  border-top: 1px solid var(--borderColor, rgba(255, 255, 255, 0.08));
}

.due-pagination-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--textSecondary, #94a3b8);
}

.due-page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.due-page-size-select {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--bgCard, #111827);
  border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.12));
  color: var(--textPrimary, #fff);
  font-size: 12.5px;
  font-weight: 700;
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.due-page-size-select:focus {
  border-color: var(--accent, #6366f1);
}

.due-pagination-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-page-ctrl {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--bgCard, #111827);
  border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.1));
  color: var(--textPrimary, #e2e8f0);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-page-ctrl:hover:not(:disabled) {
  background: var(--bgHover, rgba(255, 255, 255, 0.08));
  border-color: var(--accent, #6366f1);
  color: #fff;
  transform: translateY(-1px);
}

.btn-page-ctrl:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-page-num {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  background: var(--bgCard, #111827);
  border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.1));
  color: var(--textSecondary, #94a3b8);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-page-num:hover:not(.is-active) {
  background: var(--bgHover, rgba(255, 255, 255, 0.08));
  color: var(--textPrimary, #fff);
  border-color: var(--borderColor, rgba(255, 255, 255, 0.2));
}

.btn-page-num.is-active {
  background: var(--accentGradient, linear-gradient(135deg, #6366f1, #4f46e5));
  border-color: var(--accent, #6366f1);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
}

[data-theme-mode="light"] .due-pagination-bar {
  background: #f8fafc;
  border-top-color: rgba(15, 23, 42, 0.08);
}

[data-theme-mode="light"] .due-page-size-select {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.12);
}

[data-theme-mode="light"] .btn-page-ctrl {
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.12);
}

[data-theme-mode="light"] .btn-page-num {
  background: #ffffff;
  color: #475569;
  border-color: rgba(15, 23, 42, 0.12);
}

[data-theme-mode="light"] .btn-page-num.is-active {
  background: var(--accentGradient, linear-gradient(135deg, #4f46e5, #6366f1));
  color: #ffffff;
}
`;

if (!css.includes('due-pagination-bar')) {
  css += '\n' + paginationCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Added pagination CSS rules to DueList.css!');
}
