export interface BuildWarning {
  type: "unresolved_link" | "footnote_mismatch" | "non_conforming_structure" | "metadata_issue";
  file: string;
  message: string;
  details?: Record<string, any>;
}

class BuildReportTracker {
  private warnings: BuildWarning[] = [];

  public add(warning: BuildWarning) {
    this.warnings.push(warning);
    // Silent in production or log formatted warning in dev/test
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Midnight Archive Build Warning] [${warning.type}] in ${warning.file}: ${warning.message}`);
    }
  }

  public getWarnings(): BuildWarning[] {
    return [...this.warnings];
  }

  public getWarningsByType(type: BuildWarning["type"]): BuildWarning[] {
    return this.warnings.filter((w) => w.type === type);
  }

  public clear() {
    this.warnings = [];
  }

  public summary() {
    const counts = {
      unresolved_link: 0,
      footnote_mismatch: 0,
      non_conforming_structure: 0,
      metadata_issue: 0,
    };
    for (const w of this.warnings) {
      if (counts[w.type] !== undefined) {
        counts[w.type]++;
      }
    }
    return {
      total: this.warnings.length,
      byType: counts,
    };
  }
}

// Global singleton
export const buildReport = new BuildReportTracker();
