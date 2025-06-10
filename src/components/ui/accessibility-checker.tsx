'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Eye, Zap, Users } from 'lucide-react';
import { Button } from './button';
import { 
  validateAccessibility, 
  checkWCAGCompliance,
  useTextScaling,
  useReducedMotion,
  useHighContrast
} from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface AccessibilityReport {
  overallScore: number;
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    element: HTMLElement;
  }>;
  contrastChecks: Array<{
    element: HTMLElement;
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
    recommendation?: string;
  }>;
  userPreferences: {
    textScaling: number;
    reducedMotion: boolean;
    highContrast: boolean;
  };
}

interface AccessibilityCheckerProps {
  targetElement?: HTMLElement;
  className?: string;
  autoCheck?: boolean;
  showUserPreferences?: boolean;
}

export function AccessibilityChecker({ 
  targetElement, 
  className,
  autoCheck = false,
  showUserPreferences = true 
}: AccessibilityCheckerProps) {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  
  // User preference hooks
  const textScaling = useTextScaling();
  const reducedMotion = useReducedMotion();
  const highContrast = useHighContrast();

  const runAccessibilityCheck = useCallback(async () => {
    setIsChecking(true);
    
    // Use provided element or document body
    const element = targetElement || document.body;
    
    try {
      // Run basic accessibility validation
      const validation = validateAccessibility(element);
      
      // Check color contrasts (simplified - you might want to expand this)
      const contrastChecks: AccessibilityReport['contrastChecks'] = [];
      
      // Find text elements and check their contrast
      const textElements = element.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label');
      textElements.forEach(el => {
        try {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            // Convert colors to hex (simplified - you might want a more robust converter)
            const compliance = checkWCAGCompliance('#ffffff', '#000000'); // Placeholder
            contrastChecks.push({
              element: el as HTMLElement,
              foreground: color,
              background: backgroundColor,
              ratio: compliance.ratio,
              passes: compliance.passes,
              recommendation: compliance.recommendation
            });
          }
                 } catch {
           // Skip elements that can't be processed
         }
      });
      
      setReport({
        overallScore: validation.score,
        issues: validation.issues,
        contrastChecks,
        userPreferences: {
          textScaling,
          reducedMotion,
          highContrast
        }
      });
    } catch (error) {
      console.error('Accessibility check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [targetElement, textScaling, reducedMotion, highContrast]);

  useEffect(() => {
    if (autoCheck) {
      runAccessibilityCheck();
    }
  }, [autoCheck, runAccessibilityCheck]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const highlightElement = (element: HTMLElement) => {
    // Remove previous highlights
    document.querySelectorAll('.accessibility-highlight').forEach(el => {
      el.classList.remove('accessibility-highlight');
    });
    
    // Add highlight to current element
    element.classList.add('accessibility-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('accessibility-highlight');
    }, 3000);
  };

  return (
    <div className={cn("bg-gray-800 border border-gray-700 rounded-lg p-6", className)}>
      <style jsx>{`
        .accessibility-highlight {
          outline: 3px solid #f59e0b !important;
          outline-offset: 2px !important;
          background-color: rgba(245, 158, 11, 0.1) !important;
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Accessibility Checker</h2>
        </div>
        
        <Button
          onClick={runAccessibilityCheck}
          isLoading={isChecking}
          loadingText="Checking..."
          variant="purple"
          size="sm"
        >
          Run Check
        </Button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getScoreIcon(report.overallScore)}
                <div>
                  <h3 className="font-medium text-white">Overall Score</h3>
                  <p className="text-sm text-gray-400">WCAG compliance rating</p>
                </div>
              </div>
              <div className={cn("text-2xl font-bold", getScoreColor(report.overallScore))}>
                {report.overallScore}%
              </div>
            </div>
          </div>

          {/* User Preferences */}
          {showUserPreferences && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                User Preferences Detected
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Text Scaling:</span>
                  <span className={cn(
                    "font-medium",
                    report.userPreferences.textScaling > 1.2 ? "text-yellow-400" : "text-gray-400"
                  )}>
                    {Math.round(report.userPreferences.textScaling * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Reduced Motion:</span>
                  <span className={cn(
                    "font-medium",
                    report.userPreferences.reducedMotion ? "text-green-400" : "text-gray-400"
                  )}>
                    {report.userPreferences.reducedMotion ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">High Contrast:</span>
                  <span className={cn(
                    "font-medium",
                    report.userPreferences.highContrast ? "text-green-400" : "text-gray-400"
                  )}>
                    {report.userPreferences.highContrast ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Issues */}
          {report.issues.length > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Issues Found ({report.issues.length})
              </h3>
              <div className="space-y-2">
                {report.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded border cursor-pointer transition-colors",
                      issue.type === 'error' 
                        ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/20" 
                        : "border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20",
                      selectedIssue === index && "ring-2 ring-purple-500"
                    )}
                    onClick={() => {
                      setSelectedIssue(selectedIssue === index ? null : index);
                      highlightElement(issue.element);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {issue.type === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{issue.message}</p>
                        <p className="text-xs text-gray-400">
                          {issue.element.tagName.toLowerCase()}
                          {issue.element.className && ` .${issue.element.className.split(' ')[0]}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(issue.element);
                      }}
                    >
                      Highlight
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {report.issues.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-medium text-green-400">Great job!</h3>
                  <p className="text-sm text-green-300">No accessibility issues found.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !isChecking && (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Ready to Check</h3>
          <p className="text-gray-400 mb-4">
            Run an accessibility audit to identify potential issues and improve user experience.
          </p>
          <Button onClick={runAccessibilityCheck} variant="purple">
            Start Accessibility Check
          </Button>
        </div>
      )}
    </div>
  );
} 