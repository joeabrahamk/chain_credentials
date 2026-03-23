/**
 * Skills Dashboard Page
 * 
 * Displays a donut chart showing tech stack proficiency.
 * Top 9 skills shown in chart, rest in expandable details.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';



// ============================================
// COLOR PALETTE - Harmonious colors based on color theory
// Using analogous + complementary scheme for visual appeal
// ============================================
const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#6B7280', // Gray (for Others)
];

const SkillsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Resolve skill scores ────────────────────────────────────────────────
  // Priority: (1) router state from audit result, (2) last saved audit in
  // localStorage keyed by wallet address, (3) null → show empty state.
  const walletAddress = location.state?.walletAddress || null;
  const storageKey = walletAddress ? `skill_scores_${walletAddress}` : null;

  const resolveSkillsData = () => {
    const routeSkills = location.state?.scores?.skills;
    if (Array.isArray(routeSkills) && routeSkills.length > 0) {
      return routeSkills.map((s) => ({ name: s.name, score: s.score, remark: s.remark, level: s.level, gaps: s.gaps, recommendations: s.recommendations }));
    }
    if (!storageKey) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved?.skills?.length > 0) {
        return saved.skills.map((s) => ({ name: s.name, score: s.score, remark: s.remark, level: s.level, gaps: s.gaps, recommendations: s.recommendations }));
      }
    } catch (_) { /* ignore */ }
    return null;
  };

  const SKILLS_DATA = resolveSkillsData();
  const hasAudit = SKILLS_DATA !== null;
  const auditMeta = location.state?.scores || (() => {
    if (!storageKey) return null;
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { return null; }
  })();
  const PROJECTS_DATA = (() => {
    const routeProjects = location.state?.scores?.projects;
    if (Array.isArray(routeProjects) && routeProjects.length > 0) return routeProjects;
    if (!storageKey) return [];
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved?.projects?.length > 0) return saved.projects;
    } catch (_) { /* ignore */ }
    return [];
  })();
  const [showDetails, setShowDetails] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  // Sort skills by score (highest first)
  const sortedSkills = hasAudit ? [...SKILLS_DATA].sort((a, b) => b.score - a.score) : [];
  
  // Top 9 for chart, rest for "Others"
  const chartSkills = sortedSkills.slice(0, 9);
  const otherSkills = sortedSkills.slice(9);
  
  // Calculate "Others" combined score (average)
  const othersAvgScore = otherSkills.length > 0 
    ? Math.round(otherSkills.reduce((sum, s) => sum + s.score, 0) / otherSkills.length)
    : 0;

  // Prepare data for donut chart (include Others if there are remaining skills)
  const donutData = otherSkills.length > 0 
    ? [...chartSkills, { name: 'Others', score: othersAvgScore, isOthers: true }]
    : chartSkills;

  // Calculate total for percentage
  const totalScore = donutData.reduce((sum, skill) => sum + skill.score, 0);

  // Generate donut segments
  const generateDonutSegments = () => {
    let cumulativePercent = 0;
    const segments = [];
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    donutData.forEach((skill, index) => {
      const percent = (skill.score / totalScore) * 100;
      const dashLength = (percent / 100) * circumference;
      const dashOffset = circumference - (cumulativePercent / 100) * circumference;
      
      segments.push({
        ...skill,
        color: COLOR_PALETTE[index],
        percent,
        dashLength,
        dashOffset,
        cumulativePercent,
      });

      cumulativePercent += percent;
    });

    return segments;
  };

  const segments = generateDonutSegments();

  // Get proficiency color based on score
  const getProficiencyColor = (score) => {
    if (score >= 70) return '#22C55E'; // Green
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get proficiency label
  const getProficiencyLabel = (score) => {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Proficient';
    if (score >= 40) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="skills-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/icon.png" alt="Chain-Cred" className="header-logo" />
          <h1>Skills Dashboard</h1>
        </div>
        <div className="header-right">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* ── Live audit metadata banner ─────────────────────── */}
        {hasAudit && auditMeta && (
          <div className="audit-meta-banner">
            <div className="audit-meta-scores">
              {auditMeta.final_score != null && (
                <span className="meta-chip">
                  Overall Score: <strong>{auditMeta.final_score}</strong>
                </span>
              )}
              {auditMeta.confidence != null && (
                <span className="meta-chip">
                  Confidence: <strong>{(auditMeta.confidence * 100).toFixed(0)}%</strong>
                </span>
              )}
            </div>
            {auditMeta.audit_summary && (
              <p className="audit-summary-text">{auditMeta.audit_summary}</p>
            )}
          </div>
        )}

        {!hasAudit ? (
          <div className="empty-audit-state">
            <div className="empty-audit-visual">
              {/* Ghost donut */}
              <svg viewBox="0 0 200 200" className="ghost-donut">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" strokeWidth="22" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="url(#scanGrad)" strokeWidth="22"
                  strokeDasharray="110 330" strokeLinecap="round"
                  transform="rotate(-90 100 100)" className="scan-arc" />
                <defs>
                  <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Center pulse */}
                <circle cx="100" cy="100" r="18" fill="#eff6ff" className="pulse-circle" />
                <text x="100" y="96" textAnchor="middle" className="ghost-center-top">No</text>
                <text x="100" y="112" textAnchor="middle" className="ghost-center-bot">Audit</text>
              </svg>

              {/* Floating tech pills */}
              {['Python','React','Node.js','Docker','TypeScript','Go'].map((tech, i) => (
                <span key={tech} className="float-pill" style={{ '--i': i }}>{tech}</span>
              ))}
            </div>

            <h2 className="empty-title">No Audit Yet</h2>
            <p className="empty-desc">
              Upload your resume from the dashboard, hit <strong>Audit</strong> on any file,
              and watch your real tech&#8209;stack scores appear here.
            </p>

            <button className="go-dashboard-btn" onClick={() => navigate('/dashboard')}>
              <span className="btn-icon">⚡</span> Run Your First Audit
            </button>

            <div className="empty-steps">
              <div className="step"><span className="step-num">1</span>Upload resume to IPFS</div>
              <div className="step-arrow">→</div>
              <div className="step"><span className="step-num">2</span>Click Audit on the file</div>
              <div className="step-arrow">→</div>
              <div className="step"><span className="step-num">3</span>See your scores</div>
            </div>
          </div>
        ) : (
        <>
        <div className="chart-section">
          <div className="chart-container">
            <h2>Tech Stack Proficiency</h2>
            <p className="chart-subtitle">Hover over segments to see details</p>
            
            <div className="chart-wrapper">
              <svg viewBox="0 0 200 200" className="donut-chart">
                {segments.map((segment, index) => (
                  <circle
                    key={segment.name}
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={hoveredSkill === segment.name ? 28 : 24}
                    strokeDasharray={`${segment.dashLength} ${2 * Math.PI * 80}`}
                    strokeDashoffset={segment.dashOffset}
                    transform="rotate(-90 100 100)"
                    className="donut-segment"
                    onMouseEnter={() => setHoveredSkill(segment.name)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    style={{
                      opacity: hoveredSkill && hoveredSkill !== segment.name ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  />
                ))}
                {/* Center text */}
                <text x="100" y="95" textAnchor="middle" className="center-label">
                  {hoveredSkill || 'Skills'}
                </text>
                <text x="100" y="115" textAnchor="middle" className="center-score">
                  {hoveredSkill 
                    ? `${segments.find(s => s.name === hoveredSkill)?.score || 0}%`
                    : `${sortedSkills.length} total`
                  }
                </text>
              </svg>

              {/* Legend */}
              <div className="chart-legend">
                {segments.map((segment) => (
                  <div 
                    key={segment.name}
                    className={`legend-item ${hoveredSkill === segment.name ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredSkill(segment.name)}
                    onMouseLeave={() => setHoveredSkill(null)}
                  >
                    <span 
                      className="legend-color" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="legend-name">{segment.name}</span>
                    <span className="legend-score">{segment.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="details-button"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'View All Skills Details'}
              <span className={`arrow ${showDetails ? 'up' : 'down'}`}>▼</span>
            </button>
          </div>
        </div>

        {/* Expandable Details Section */}

        <div className={`details-section ${showDetails ? 'expanded' : ''}`}>
          <div className="details-content">
            <h3>All Skills Breakdown</h3>
            <div className="skills-list">
              {sortedSkills.map((skill, index) => (
                <div key={skill.name} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-rank">#{index + 1}</span>
                    <span className="skill-name">{skill.name}</span>
                    <span 
                      className="skill-level"
                      style={{ color: getProficiencyColor(skill.score) }}
                    >
                      {getProficiencyLabel(skill.score)}
                    </span>
                    <span className="skill-score">{skill.score}/100</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${skill.score}%`,
                        backgroundColor: getProficiencyColor(skill.score)
                      }}
                    />
                  </div>
                  {skill.remark && (
                    <p className="skill-remark">{skill.remark}</p>
                  )}
                  {skill.gaps?.length > 0 && (
                    <ul className="skill-gaps">
                      {skill.gaps.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Project Insights ─────────────────────────── */}
        {PROJECTS_DATA.length > 0 && (
          <div className="projects-section">
            <h3 className="projects-heading">Project Insights</h3>
            <p className="projects-subheading">Per-repository breakdown of strengths and weaknesses.</p>
            <div className="projects-list">
              {PROJECTS_DATA.map((proj, idx) => {
                const isExpanded = expandedProject === idx;
                const scoreEntries = Object.entries(proj.scores || {});
                return (
                  <div key={idx} className="project-card">
                    <div
                      className="project-card-header"
                      onClick={() => setExpandedProject(isExpanded ? null : idx)}
                    >
                      <div className="project-title-row">
                        <span className="project-icon">📁</span>
                        <span className="project-name">
                          {proj.url
                            ? <a href={proj.url} target="_blank" rel="noreferrer">{proj.name}</a>
                            : proj.name}
                        </span>
                        {proj.final_score != null && (
                          <span
                            className="project-score-badge"
                            style={{ background: proj.final_score >= 70 ? '#dcfce7' : proj.final_score >= 40 ? '#fef3c7' : '#fee2e2',
                                     color: proj.final_score >= 70 ? '#166534' : proj.final_score >= 40 ? '#92400e' : '#991b1b' }}
                          >
                            {proj.final_score}/100
                          </span>
                        )}
                      </div>
                      <span className={`project-chevron ${isExpanded ? 'open' : ''}`}>▼</span>
                    </div>

                    {isExpanded && (
                      <div className="project-card-body">
                        {/* Score bars */}
                        {scoreEntries.length > 0 && (
                          <div className="project-scores">
                            {scoreEntries.map(([key, val]) => (
                              <div key={key} className="project-score-row">
                                <span className="project-score-label">{key.replace(/_/g, ' ')}</span>
                                <div className="proj-bar-wrap">
                                  <div
                                    className="proj-bar-fill"
                                    style={{
                                      width: `${Math.min(val, 100)}%`,
                                      background: val >= 70 ? '#22c55e' : val >= 40 ? '#f97316' : '#ef4444'
                                    }}
                                  />
                                </div>
                                <span className="project-score-val">{Math.round(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="project-sw-grid">
                          {/* Strengths */}
                          <div className="project-sw-block strengths">
                            <h4>✅ Strengths</h4>
                            {proj.strengths?.length > 0
                              ? <ul>{proj.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                              : <p className="sw-empty">None detected</p>}
                          </div>
                          {/* Weaknesses */}
                          <div className="project-sw-block weaknesses">
                            <h4>⚠️ Weaknesses</h4>
                            {proj.weaknesses?.length > 0
                              ? <ul>{proj.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                              : <p className="sw-empty">None detected</p>}
                          </div>
                        </div>

                        {/* Evidence chips */}
                        <div className="project-evidence">
                          <span className="ev-chip">{proj.commits} commits</span>
                          <span className="ev-chip">+{proj.lines_added} lines</span>
                          {proj.readme_exists && <span className="ev-chip ev-green">README ✓</span>}
                          {proj.modular_structure && <span className="ev-chip ev-green">Modular ✓</span>}
                          {proj.confirmed_stacks?.length > 0 && (
                            <span className="ev-chip ev-blue">{proj.confirmed_stacks.join(', ')}</span>
                          )}
                          {proj.false_claims?.length > 0 && (
                            <span className="ev-chip ev-red">Unverified: {proj.false_claims.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}
      </main>

      <style>{`
        .skills-dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-logo {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 10px;
          padding: 6px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        .header-left h1 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: #1e293b;
        }

        .back-button {
          padding: 10px 18px;
          background: #fff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .back-button:hover {
          background: #f8fafc;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .dashboard-content {
          max-width: 900px;
          margin: 40px auto;
          padding: 0 24px;
        }

        .chart-section {
          display: flex;
          justify-content: flex-start;
        }

        .chart-container {
          background: #fff;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 600px;
        }

        .chart-container h2 {
          margin: 0 0 4px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .chart-subtitle {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #64748b;
        }

        .chart-wrapper {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .donut-chart {
          width: 220px;
          height: 220px;
          flex-shrink: 0;
        }

        .donut-segment {
          stroke-linecap: butt;
        }

        .center-label {
          font-size: 14px;
          font-weight: 600;
          fill: #1e293b;
        }

        .center-score {
          font-size: 12px;
          fill: #64748b;
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .legend-item:hover,
        .legend-item.active {
          background: #f8fafc;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .legend-score {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .details-button {
          width: 100%;
          padding: 14px 20px;
          background: #f8fafc;
          color: #374151;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.15s ease;
        }

        .details-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .details-button .arrow {
          font-size: 10px;
          transition: transform 0.3s ease;
        }

        .details-button .arrow.up {
          transform: rotate(180deg);
        }

        /* Details Section */
        .details-section {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-out;
        }

        .details-section.expanded {
          max-height: 2000px;
          transition: max-height 0.5s ease-in;
        }

        .details-content {
          background: #fff;
          padding: 28px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          margin-top: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .details-content h3 {
          margin: 0 0 24px 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skill-item {
          padding: 16px 20px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid #f3f4f6;
        }

        .skill-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .skill-rank {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          min-width: 24px;
        }

        .skill-name {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .skill-level {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
        }

        .skill-score {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          min-width: 55px;
          text-align: right;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }

        @media (max-width: 700px) {
          .chart-wrapper {
            flex-direction: column;
            align-items: center;
          }

          .chart-legend {
            width: 100%;
          }

          .chart-container {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .dashboard-header {
            padding: 12px 16px;
          }

          .dashboard-content {
            padding: 0 16px;
            margin: 24px auto;
          }

          .chart-container {
            padding: 20px;
          }

          .donut-chart {
            width: 180px;
            height: 180px;
          }
        }

        /* ── Empty audit state ─────────────────────────── */
        .empty-audit-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px 56px;
          text-align: center;
          position: relative;
        }

        .empty-audit-visual {
          position: relative;
          width: 220px;
          height: 220px;
          margin-bottom: 32px;
        }

        .ghost-donut {
          width: 220px;
          height: 220px;
        }

        .scan-arc {
          animation: scanRotate 2.4s linear infinite;
          transform-origin: 100px 100px;
        }

        @keyframes scanRotate {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(270deg); }
        }

        .pulse-circle {
          animation: pulseScale 2s ease-in-out infinite;
          transform-origin: 100px 100px;
        }

        @keyframes pulseScale {
          0%, 100% { r: 18; opacity: 1; }
          50%       { r: 24; opacity: 0.5; }
        }

        .ghost-center-top {
          font-size: 13px;
          font-weight: 700;
          fill: #94a3b8;
        }

        .ghost-center-bot {
          font-size: 10px;
          fill: #cbd5e1;
        }

        /* Floating pills positioned around the donut */
        .float-pill {
          position: absolute;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(255,255,255,0.9);
          border: 1px solid #e2e8f0;
          color: #475569;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          white-space: nowrap;
          animation: floatPill 3s ease-in-out infinite;
          animation-delay: calc(var(--i) * 0.5s);
          /* positions around the circle */
        }
        .float-pill:nth-child(2)  { top: -10px;  left: 70px;  }
        .float-pill:nth-child(3)  { top: 20px;   right: -30px; }
        .float-pill:nth-child(4)  { top: 85px;   right: -45px; }
        .float-pill:nth-child(5)  { bottom: 20px; right: -25px; }
        .float-pill:nth-child(6)  { bottom: -10px; left: 55px; }
        .float-pill:nth-child(7)  { top: 80px;   left: -42px; }

        @keyframes floatPill {
          0%, 100% { transform: translateY(0px);   opacity: 0.7; }
          50%       { transform: translateY(-6px);  opacity: 1; }
        }

        .empty-title {
          margin: 0 0 12px;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .empty-desc {
          margin: 0 0 28px;
          font-size: 14px;
          color: #64748b;
          max-width: 360px;
          line-height: 1.7;
        }

        .go-dashboard-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35);
          transition: all 0.2s ease;
          animation: btnGlow 2.5s ease-in-out infinite;
          margin-bottom: 36px;
        }

        .go-dashboard-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(37,99,235,0.45);
        }

        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(37,99,235,0.35); }
          50%       { box-shadow: 0 4px 32px rgba(124,58,237,0.5); }
        }

        .btn-icon {
          font-size: 18px;
        }

        .empty-steps {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .step-num {
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: #fff;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-arrow {
          color: #cbd5e1;
          font-size: 16px;
        }
        .audit-meta-banner {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 14px;
          padding: 16px 24px;
          margin-bottom: 24px;
        }

        .audit-meta-scores {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .meta-chip {
          background: rgba(255,255,255,0.8);
          border: 1px solid #bfdbfe;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 13px;
          color: #1d4ed8;
        }

        .meta-chip strong {
          font-weight: 700;
        }

        .audit-summary-text {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.6;
        }

        .no-audit-notice {
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 13px;
          color: #92400e;
          margin-bottom: 24px;
        }

        .link-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        /* ── Skill detail additions ─────────────────────────── */
        .skill-remark {
          margin: 6px 0 0 0;
          font-size: 12.5px;
          color: #64748b;
          font-style: italic;
        }

        .skill-gaps {
          margin: 6px 0 0 16px;
          padding: 0;
          font-size: 12px;
          color: #dc2626;
          line-height: 1.7;
        }

        /* \u2500\u2500 Project Insights \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
        .projects-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px 32px;
          margin-top: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }

        .projects-heading {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .projects-subheading {
          margin: 0 0 20px 0;
          font-size: 13px;
          color: #64748b;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .project-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .project-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #f8fafc;
          cursor: pointer;
          transition: background 0.15s ease;
          user-select: none;
        }

        .project-card-header:hover {
          background: #f1f5f9;
        }

        .project-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .project-icon {
          font-size: 16px;
        }

        .project-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .project-name a {
          color: #2563eb;
          text-decoration: none;
        }

        .project-name a:hover {
          text-decoration: underline;
        }

        .project-score-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
        }

        .project-chevron {
          font-size: 10px;
          color: #94a3b8;
          transition: transform 0.25s ease;
        }

        .project-chevron.open {
          transform: rotate(180deg);
        }

        .project-card-body {
          padding: 18px 18px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .project-scores {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .project-score-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .project-score-label {
          font-size: 12px;
          color: #64748b;
          text-transform: capitalize;
          min-width: 130px;
        }

        .proj-bar-wrap {
          flex: 1;
          height: 7px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .proj-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .project-score-val {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          min-width: 28px;
          text-align: right;
        }

        .project-sw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 600px) {
          .project-sw-grid { grid-template-columns: 1fr; }
        }

        .project-sw-block {
          border-radius: 10px;
          padding: 12px 16px;
        }

        .project-sw-block.strengths {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .project-sw-block.weaknesses {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .project-sw-block h4 {
          margin: 0 0 8px 0;
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
        }

        .project-sw-block ul {
          margin: 0;
          padding-left: 16px;
          font-size: 12.5px;
          line-height: 1.8;
          color: #374151;
        }

        .sw-empty {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          font-style: italic;
        }

        .project-evidence {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ev-chip {
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .ev-chip.ev-green {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }

        .ev-chip.ev-blue {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .ev-chip.ev-red {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
};

export default SkillsDashboard;
