import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Helper to get CSS variables dynamically
function getCssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * 도넛 차트 생성
 */
export function createDoughnutChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const textColor = getCssVar('--text-secondary', '#7B6D8E');
  const tooltipBg = document.documentElement.getAttribute('data-theme') === 'dark' 
    ? 'rgba(38, 26, 61, 0.96)' 
    : 'rgba(255, 255, 255, 0.96)';
  const tooltipText = getCssVar('--text-primary', '#3D2C52');
  const tooltipBorder = getCssVar('--border-color', 'rgba(200, 160, 220, 0.18)');

  // Global defaults update for current render
  Chart.defaults.font.family = "'Noto Sans KR', -apple-system, sans-serif";
  Chart.defaults.color = textColor;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: data.colors,
          borderWidth: 2,
          borderColor: getCssVar('--bg-secondary', '#FFFFFF'),
          hoverBorderWidth: 3,
          hoverBorderColor: getCssVar('--accent-primary-light', '#D4A5FF'),
          spacing: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12, weight: '600' },
            color: textColor,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          titleFont: { size: 13, weight: '700' },
          bodyFont: { size: 12, weight: '500' },
          padding: 12,
          cornerRadius: 14,
          borderColor: tooltipBorder,
          borderWidth: 1.5,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ${context.label}: ${value.toLocaleString()}원 (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        animateRotate: true,
        duration: 800,
        easing: 'easeOutQuart',
      },
    },
  });
}

/**
 * 막대 차트 생성 (월별 수입/지출)
 */
export function createBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const textColor = getCssVar('--text-secondary', '#7B6D8E');
  const gridColor = getCssVar('--border-light', 'rgba(200, 160, 220, 0.08)');
  const incomeColor = getCssVar('--color-income', '#5CC9A7');
  const expenseColor = getCssVar('--color-expense', '#FF8FA3');
  const tooltipBg = document.documentElement.getAttribute('data-theme') === 'dark' 
    ? 'rgba(38, 26, 61, 0.96)' 
    : 'rgba(255, 255, 255, 0.96)';
  const tooltipText = getCssVar('--text-primary', '#3D2C52');
  const tooltipBorder = getCssVar('--border-color', 'rgba(200, 160, 220, 0.18)');

  // Global defaults update for current render
  Chart.defaults.font.family = "'Noto Sans KR', -apple-system, sans-serif";
  Chart.defaults.color = textColor;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: '수입',
          data: data.income,
          backgroundColor: incomeColor,
          hoverBackgroundColor: incomeColor,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
        {
          label: '지출',
          data: data.expense,
          backgroundColor: expenseColor,
          hoverBackgroundColor: expenseColor,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12, weight: '600' },
            color: textColor,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          titleFont: { size: 13, weight: '700' },
          bodyFont: { size: 12, weight: '500' },
          padding: 12,
          cornerRadius: 14,
          borderColor: tooltipBorder,
          borderWidth: 1.5,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}원`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            font: { size: 11, weight: '600' },
            color: textColor
          },
        },
        y: {
          grid: {
            color: gridColor,
          },
          ticks: {
            font: { size: 11 },
            color: textColor,
            callback: function (value) {
              if (value >= 10000) return (value / 10000).toFixed(0) + '만';
              return value.toLocaleString();
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
    },
  });
}

/**
 * 차트 인스턴스 파괴
 */
export function destroyChart(chartInstance) {
  if (chartInstance) {
    chartInstance.destroy();
  }
}
