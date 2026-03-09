/**
 * Skills Dashboard Page
 * 
 * Displays a donut chart showing tech stack proficiency.
 * Top 9 skills shown in chart, rest in expandable details.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================
// FALLBACK SKILLS DATA - shown before first audit
// ============================================
const FALLBACK_SKILLS_DATA = [
  { name: 'React', score: 92 },
  { name: 'JavaScript', score: 88 },
  { name: 'Node.js', score: 85 },
  { name: 'Python', score: 78 },
  { name: 'Solidity', score: 72 },
  { name: 'TypeScript', score: 70 },
  { name: 'MongoDB', score: 68 },
  { name: 'PostgreSQL', score: 65 },
  { name: 'Docker', score: 60 },
  { name: 'AWS', score: 55 },
  { name: 'GraphQL', score: 52 },
  { name: 'Redis', score: 48 },
  { name: 'Kubernetes', score: 42 },
  { name: 'Go', score: 38 },
  { name: 'Rust', score: 30 },
];

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
  // localStorage, (3) fallback hardcoded data shown before first audit.
  const resolveSkillsData = () => {
    const routeSkills = location.state?.scores?.skills;
    if (Array.isArray(routeSkills) && routeSkills.length > 0) {
      return routeSkills.map((s) => ({ name: s.name, score: s.score, remark: s.remark, level: s.level, gaps: s.gaps, recommendations: s.recommendations }));
    }
    try {
      const saved = JSON.parse(localStorage.getItem('last_skill_scores') || 'null');
      if (saved?.skills?.length > 0) {
        return saved.skills.map((s) => ({ name: s.name, score: s.score, remark: s.remark, level: s.level, gaps: s.gaps, recommendations: s.recommendations }));
      }
    } catch (_) { /* ignore */ }
    return FALLBACK_SKILLS_DATA;
  };

  const isLiveData = !!(location.state?.scores?.skills || (() => {
    try { return JSON.parse(localStorage.getItem('last_skill_scores') || 'null')?.skills?.length > 0; } catch (_) { return false; }
  })());

  const SKILLS_DATA = resolveSkillsData();
  const auditMeta = location.state?.scores || (() => {
    try { return JSON.parse(localStorage.getItem('last_skill_scores') || 'null'); } catch (_) { return null; }
  })();
  const [showDetails, setShowDetails] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  // Sort skills by score (highest first)
  const sortedSkills = [...SKILLS_DATA].sort((a, b) => b.score - a.score);
  
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
        {isLiveData && auditMeta && (
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

        {!isLiveData && (
          <div className="no-audit-notice">
            Showing sample data — upload your resume from the{' '}
            <button className="link-btn" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>{' '}
            to see your real skill scores.
          </div>
        )}

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

        /* ── Audit banner & notice ─────────────────────────── */
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
      `}</style>
    </div>
  );
};

export default SkillsDashboard;
