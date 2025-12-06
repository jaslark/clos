import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NgxChartsModule } from '@swimlane/ngx-charts';

// --- Types ---

interface OCRRecord {
  id: string;
  filename: string;
  uploadtime: string; // ISO Date
  typeocr: string; // Report Template Type
  statusocr: number; // 4 = Success, others = Fail
  pagecount: number;
  circular: string | null; // If not null, manual
  timeocr: number; // seconds
}

interface KPI {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string; // Material Icon name
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  warning?: boolean;
}

// --- Mock Data Generator ---

const SAMPLE_TYPES = ["BCTC_Mau_A", "BCTC_Mau_B", "BCTC_HopNhat", "BCTC_RiengLe", "BCTC_NuocNgoai", "BCTC_NoiBo"];
const STATUS_CODES = [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 5, 6]; // Weighted towards 4 (Success)

const generateMockData = (count: number): OCRRecord[] => {
  const data: OCRRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const isSuccess = Math.random() > 0.15; // 85% success rate simulation
    const status = isSuccess ? 4 : STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
    const pageCount = Math.floor(Math.random() * 50) + 1;

    // Simulate speed differences by type
    const type = SAMPLE_TYPES[Math.floor(Math.random() * SAMPLE_TYPES.length)];
    let speedFactor = 2;
    if (type === "BCTC_HopNhat") speedFactor = 8; // Slower
    if (type === "BCTC_Mau_A") speedFactor = 1.5; // Faster

    // Time per page usually 2-10 seconds depending on type complexity
    const timeocr = Math.floor(pageCount * (speedFactor + Math.random() * 4));

    data.push({
      id: `FILE_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      filename: `Report_${type}_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}_${Math.random().toString(36).substr(2, 4)}.pdf`,
      uploadtime: date.toISOString(),
      typeocr: type,
      statusocr: status,
      pagecount: pageCount,
      circular: Math.random() > 0.95 ? "Manual_Review_Req" : null,
      timeocr: timeocr,
    });
  }
  return data.sort((a, b) => new Date(b.uploadtime).getTime() - new Date(a.uploadtime).getTime());
};

const MOCK_DATA = generateMockData(2000);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Filters
  dateRange = signal<"thisMonth" | "lastMonth" | "thisYear" | "last7Days">("thisMonth");
  selectedType = signal<string>("All");
  selectedStatus = signal<string>("All");

  sampleTypes = SAMPLE_TYPES;

  colorScheme: any = {
    domain: ['#cbd5e1', '#3b82f6', '#f97316']
  };

  // Derived State
  filteredData = computed(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const range = this.dateRange();

    if (range === "last7Days") {
      end = now;
      start = new Date(now);
      start.setDate(now.getDate() - 7);

      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 7);
    } else if (range === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (range === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    } else if (range === "thisYear") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);

      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    const filterFn = (item: OCRRecord, s: Date, e: Date) => {
      const d = new Date(item.uploadtime);
      const dateMatch = d >= s && d <= e;
      const typeMatch = this.selectedType() === "All" || item.typeocr === this.selectedType();
      const statusMatch = this.selectedStatus() === "All" ? true :
        this.selectedStatus() === "Success" ? item.statusocr === 4 : item.statusocr !== 4;
      return dateMatch && typeMatch && statusMatch;
    };

    return {
      currentData: MOCK_DATA.filter((i) => filterFn(i, start, end)),
      prevData: MOCK_DATA.filter((i) => filterFn(i, prevStart, prevEnd)),
      yearToDateData: MOCK_DATA.filter((i) => new Date(i.uploadtime) >= yearStart),
      dateRangeLabel: range // For chart grouping
    };
  });

  // Metrics
  metrics = computed(() => {
    const { currentData, prevData, yearToDateData } = this.filteredData();
    const curr = this.calculateMetrics(currentData);
    const prev = this.calculateMetrics(prevData);

    // License Calculation
    const licenseQuota = 200000;
    const yearTotalPages = yearToDateData.reduce((sum, item) => sum + item.pagecount, 0);
    const licenseUsedPercent = (yearTotalPages / licenseQuota) * 100;
    const licenseWarning = licenseUsedPercent > 80;

    return {
      curr,
      prev,
      license: {
        usedPercent: licenseUsedPercent,
        warning: licenseWarning,
        total: yearTotalPages,
        quota: licenseQuota
      }
    };
  });

  // Chart Data
  chartData = computed(() => {
    const { currentData, dateRangeLabel } = this.filteredData();
    const grouped: Record<string, { date: string; success: number; total: number; speedSum: number; pageSum: number }> = {};

    currentData.forEach(item => {
      const d = new Date(item.uploadtime);
      const isYearly = dateRangeLabel === 'thisYear';
      const key = isYearly
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

      if (!grouped[key]) grouped[key] = { date: key, success: 0, total: 0, speedSum: 0, pageSum: 0 };

      grouped[key].total++;
      if (item.statusocr === 4) grouped[key].success++;
      grouped[key].speedSum += (item.timeocr / item.pagecount);
      grouped[key].pageSum += item.pagecount;
    });

    // Transform for ngx-charts
    // We need separate series for multi-line/bar chart
    const pagesSeries = [];
    const successSeries = [];
    const speedSeries = [];

    const sortedGroups = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    for (const g of sortedGroups) {
      pagesSeries.push({ name: g.date, value: g.pageSum });
      successSeries.push({ name: g.date, value: Number(((g.success / g.total) * 100).toFixed(1)) });
      speedSeries.push({ name: g.date, value: g.total > 0 ? Number((g.speedSum / g.total).toFixed(2)) : 0 });
    }

    return [
      { name: 'Pages Processed', series: pagesSeries },
      { name: 'Success Rate (%)', series: successSeries },
      { name: 'Avg Speed (s/pg)', series: speedSeries }
    ];
  });

  // Performance Clusters
  performanceClusters = computed(() => {
    const { currentData } = this.filteredData();
    const groups: Record<string, { total: number; speedSum: number; success: number }> = {};

    currentData.forEach(item => {
      if (!groups[item.typeocr]) groups[item.typeocr] = { total: 0, speedSum: 0, success: 0 };
      groups[item.typeocr].total++;
      groups[item.typeocr].speedSum += (item.timeocr / item.pagecount);
      if (item.statusocr === 4) groups[item.typeocr].success++;
    });

    return Object.entries(groups).map(([type, stats]) => ({
      type,
      avgSpeed: stats.speedSum / stats.total,
      successRate: (stats.success / stats.total) * 100,
      count: stats.total
    })).sort((a, b) => a.avgSpeed - b.avgSpeed);
  });

  // Lists
  failedFiles = computed(() => {
    return this.filteredData().currentData.filter(i => i.statusocr !== 4).slice(0, 10);
  });

  slowFiles = computed(() => {
    return [...this.filteredData().currentData].sort((a, b) => b.timeocr - a.timeocr).slice(0, 10);
  });

  // Helpers
  calculateMetrics(data: OCRRecord[]) {
    const totalFiles = data.length;
    const totalPages = data.reduce((sum, item) => sum + item.pagecount, 0);
    const successFiles = data.filter((item) => item.statusocr === 4).length;
    const failedFiles = totalFiles - successFiles;
    const manualFiles = data.filter((item) => item.circular !== null).length;

    const sumSpeed = data.reduce((sum, item) => sum + (item.timeocr / item.pagecount), 0);
    const avgSpeed = totalFiles > 0 ? (sumSpeed / totalFiles).toFixed(2) : "0.00";
    const successRate = totalFiles > 0 ? ((successFiles / totalFiles) * 100).toFixed(1) : "0.0";

    return { totalFiles, totalPages, successFiles, failedFiles, manualFiles, avgSpeed, successRate };
  }

  getTrend(curr: number | string, prev: number | string, inverse = false) {
    const c = Number(curr);
    const p = Number(prev);
    if (p === 0) return { direction: "neutral" as const, value: "0%" };
    const diff = ((c - p) / p) * 100;
    const direction = diff > 0 ? (inverse ? "down" : "up") : diff < 0 ? (inverse ? "up" : "down") : "neutral";
    return { direction, value: `${Math.abs(diff).toFixed(1)}%` };
  }

  setDateRange(range: "thisMonth" | "lastMonth" | "thisYear" | "last7Days") {
    this.dateRange.set(range);
  }

  setFilterType(type: string) {
    this.selectedType.set(type);
  }

  setFilterStatus(status: string) {
    this.selectedStatus.set(status);
  }
}
